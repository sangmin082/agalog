import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DS } from '../theme';
import { loginWithEmail } from '../storage/auth';

interface Props {
  onLogin: () => void;
  onGoSignup: () => void;
}

export default function LoginScreen({ onLogin, onGoSignup }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
      onLogin();
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🍼</Text>
            <Text style={styles.appName}>아가로그</Text>
            <Text style={styles.tagline}>소중한 아기의 모든 기록</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>로그인</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={DS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={DS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>로그인</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social */}
            <TouchableOpacity
              style={styles.kakaoBtn}
              onPress={() => Alert.alert('카카오 로그인', '카카오 개발자 콘솔에서 앱 키를 등록하면 사용할 수 있어요.\ndevelopers.kakao.com')}
            >
              <Text style={styles.kakaoBtnText}>🟡 카카오로 계속하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.naverBtn}
              onPress={() => Alert.alert('네이버 로그인', '네이버 개발자 센터에서 앱을 등록하면 사용할 수 있어요.\ndevelopers.naver.com')}
            >
              <Text style={styles.naverBtnText}>🟢 네이버로 계속하기</Text>
            </TouchableOpacity>
          </View>

          {/* Signup link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
            <TouchableOpacity onPress={onGoSignup}>
              <Text style={styles.footerLink}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  logo: { fontSize: 64, marginBottom: 10 },
  appName: { fontSize: 32, fontWeight: '900', color: DS.text, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: DS.textSub, marginTop: 6 },

  form: { backgroundColor: DS.bgSoft, borderRadius: 24, padding: 24, marginBottom: 20 },
  formTitle: { fontSize: 22, fontWeight: '800', color: DS.text, marginBottom: 20 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: DS.textSub, marginBottom: 6 },
  input: {
    backgroundColor: DS.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: DS.text,
    borderWidth: 1,
    borderColor: '#E8EAF0',
  },

  primaryBtn: {
    backgroundColor: DS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8EAF0' },
  dividerText: { marginHorizontal: 12, color: DS.textLight, fontSize: 13 },

  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  kakaoBtnText: { fontWeight: '700', fontSize: 15, color: '#191919' },

  naverBtn: {
    backgroundColor: '#03C75A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  naverBtnText: { fontWeight: '700', fontSize: 15, color: '#fff' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: DS.textSub, fontSize: 14 },
  footerLink: { color: DS.primary, fontWeight: '700', fontSize: 14 },
});
