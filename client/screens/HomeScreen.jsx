import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";

import { APP_NAME, SLIDES } from "../constants";
import getStyles from "../styles";
import { useTheme } from "../ThemeContext";

function FeatureCarousel(props) {
  const styles = props.styles;
  const totalSlides = SLIDES.length;
  const [step, setStep] = useState(0);
  const position = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get("window").width;
  const centerWidth = Math.min(560, screenWidth - 120);
  const centerHeight = centerWidth / 1.83;
  const glowRoom = 60;
  const spacing = centerWidth + 40;
  const pauseTime = 3000;
  const slideTime = 1100;

  function imageForSlot(slot) {
    const wrapped = ((-slot % totalSlides) + totalSlides) % totalSlides;
    return SLIDES[wrapped];
  }

  useEffect(function () {
    const timer = setInterval(function () {
      setStep(function (currentStep) {
        return currentStep - 1;
      });
    }, pauseTime + slideTime);

    return function () {
      clearInterval(timer);
    };
  }, []);

  useEffect(function () {
    Animated.timing(position, {
      toValue: step,
      duration: slideTime,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);

  const front = step;
  const currentImageIndex = ((-front % totalSlides) + totalSlides) % totalSlides;
  const slots = [front + 1, front, front - 1];

  return (
    <View style={styles.carousel}>
      <View style={[styles.clip, { width: centerWidth + glowRoom * 2, paddingHorizontal: glowRoom }]}>
        <View style={[styles.stage, { height: centerHeight }]}>
          {slots.map(function (slot) {
            const translateX = Animated.multiply(Animated.subtract(slot, position), spacing);
            return (
              <Animated.View
                key={slot}
                style={[
                  styles.glow,
                  styles.centerAbs,
                  {
                    width: centerWidth,
                    marginLeft: -centerWidth / 2,
                    marginTop: -centerHeight / 2,
                    zIndex: slot === front ? 2 : 1,
                    transform: [{ translateX: translateX }],
                  },
                ]}
              >
                <Image
                  source={imageForSlot(slot)}
                  style={[styles.slide, { width: centerWidth, height: centerHeight }]}
                  resizeMode="cover"
                />
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={styles.dots}>
        {SLIDES.map(function (slide, index) {
          const isActive = index === currentImageIndex;
          return <View key={index} style={[styles.dot, isActive && styles.dotActive]} />;
        })}
      </View>
    </View>
  );
}

export default function HomeScreen(props) {
  const onLoginPress = props.onLoginPress;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const styles = getStyles(colors);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          Study<Text style={styles.logoAccent}>Meet</Text>
        </Text>
        <Pressable
          onPress={onLoginPress}
          style={function (state) {
            return [styles.loginButton, state.pressed && styles.loginButtonPressed];
          }}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>Video classes that check in on every student</Text>
        <Text style={styles.subtitle}>
          {APP_NAME} is a simple video call conference app built for teachers and students.
          Host or join a meeting, and afterwards the app automatically emails students to
          see how they are doing.
        </Text>
        <Pressable
          onPress={onLoginPress}
          style={function (state) {
            return [styles.joinButton, state.pressed && styles.joinButtonPressed];
          }}
        >
          <Text style={styles.joinButtonText}>Get Started</Text>
        </Pressable>
      </View>

      <FeatureCarousel styles={styles} />

      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerContact}>Contact us</Text>
        <Text style={styles.footerEmail}>studymeet.university@gmail.com</Text>
        <Text style={styles.footerCopy}>Copyright 2026 {APP_NAME}. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}
