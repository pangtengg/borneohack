import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { PHRASE_CATEGORIES } from '../constants/phrases';

interface Props {
    visible: boolean;
    onClose: () => void;
    onTranslateAndSpeak: (text: string) => Promise<void>;
}

export function ManualFallbackModal({ visible, onClose, onTranslateAndSpeak }: Props) {
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(PHRASE_CATEGORIES[0].id as string);

    const handleSubmit = async () => {
        if (!text.trim() || isProcessing) return;

        setIsProcessing(true);
        try {
            await onTranslateAndSpeak(text);
            setText('');
            onClose();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Translation failed. Check your connection.';
            Alert.alert('Could not translate', msg, [{ text: 'OK' }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Manual Text Fallback</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Quick Category Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabScroll}
                        contentContainerStyle={styles.tabScrollContent}
                    >
                        {PHRASE_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.tab,
                                    activeTab === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                                ]}
                                onPress={() => setActiveTab(cat.id)}
                            >
                                <Text style={styles.tabIcon}>{cat.icon}</Text>
                                <Text style={[styles.tabLabel, activeTab === cat.id && { color: '#fff' }]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type your message here..."
                            placeholderTextColor={Colors.textMuted}
                            value={text}
                            onChangeText={setText}
                            multiline
                            numberOfLines={4}
                            maxLength={200}
                            editable={!isProcessing}
                        />
                        <Text style={styles.charCount}>{text.length}/200</Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            (!text.trim() || isProcessing) && styles.submitBtnDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!text.trim() || isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.submitBtnText}>Translate & Speak 🔊</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    closeTxt: {
        color: Colors.textMuted,
        fontSize: 20,
    },
    tabScroll: {
        flexGrow: 0,
        marginBottom: 20,
    },
    tabScrollContent: {
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    tabIcon: { fontSize: 14 },
    tabLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        color: Colors.textPrimary,
        fontSize: 16,
        height: 120,
        textAlignVertical: 'top',
    },
    charCount: {
        color: Colors.textMuted,
        fontSize: 11,
        textAlign: 'right',
        marginTop: 6,
    },
    submitBtn: {
        backgroundColor: Colors.accentDark,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
