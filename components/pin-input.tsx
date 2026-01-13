import React, { useRef, useState, useEffect } from "react";
import { View, TextInput, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";

interface PinInputProps {
    length?: number;
    onComplete: (pin: string) => void;
    onChangePin?: (pin: string) => void;
    error?: boolean;
}

export function PinInput({ length = 6, onComplete, onChangePin, error = false }: PinInputProps) {
    const [pin, setPin] = useState<string[]>(Array(length).fill(""));
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        // Clear PIN when error prop changes to true
        if (error) {
            setPin(Array(length).fill(""));
            inputRefs.current[0]?.focus();
        }
    }, [error, length]);

    const handleChangeText = (text: string, index: number) => {
        // Only allow numbers
        if (text && !/^\d$/.test(text)) {
            return;
        }

        const newPin = [...pin];
        newPin[index] = text;
        setPin(newPin);

        // Haptic feedback on input
        if (Platform.OS !== "web" && text) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Move to next input
        if (text && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Call onChangePin callback
        const currentPin = newPin.join("");
        onChangePin?.(currentPin);

        // Check if PIN is complete
        if (newPin.every((digit) => digit !== "") && newPin.length === length) {
            onComplete(newPin.join(""));
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace") {
            if (pin[index] === "" && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newPin = [...pin];
                newPin[index] = "";
                setPin(newPin);
                onChangePin?.(newPin.join(""));
            }
        }
    };

    return (
        <View className="flex-row gap-3 justify-center">
            {Array.from({ length }).map((_, index) => (
                <View
                    key={index}
                    className={`w-14 h-16 rounded-xl border-2 items-center justify-center ${error
                            ? "border-error bg-error/10"
                            : pin[index]
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background"
                        }`}
                >
                    <TextInput
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        className="text-2xl font-bold text-center text-foreground w-full h-full"
                        keyboardType="number-pad"
                        maxLength={1}
                        value={pin[index]}
                        onChangeText={(text) => handleChangeText(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        secureTextEntry
                        selectTextOnFocus
                        autoComplete="off"
                        autoCorrect={false}
                        textContentType="oneTimeCode"
                    />
                </View>
            ))}
        </View>
    );
}
