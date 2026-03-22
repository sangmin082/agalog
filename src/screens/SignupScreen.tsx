import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DS, cardShadow } from '../theme';
import { signupWithEmail } from '../storage/auth';
import { saveBabyProfile } from '../storage/auth';

interface Props {
  onSignup: () => void;
  onGoLogin: () => void;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDisplayDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatDisplayTime(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${ampm} ${h12}:${m}`;
}

export default function SignupScreen({ onSignup, onGoLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [babyName, setBabyName] = useState('');
  const [birthday, setBirthday] = useState<Date>(new Date());
  const [birthTime, setBirthTime] = useState<Date>(new Date());

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function validateStep1(): boolean {
    if (!name.trim()) { Alert.alert('입력 오류', '이름을 입력해주세요.'); return false; }
    if (!email.trim() || !email.includes('@')) { Alert.alert('입력 오류', '올바른 이메일을 입력해주세요.'); return false; }
    if (password.length < 6) { Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 해요.'); return false; }
    if (password !== passwordConfirm) { Alert.alert('입력 오류', '비밀번호가 일치하지 않아요.'); return false; }
    return true;
  }

  async function handleSignup() {
    if (!babyName.trim()) { Alert.alert('입력 오류', '아기 이름을 입력해주세요.'); return; }
    setLoading(true);
    try {
      await signupWithEmail(email.trim().toLowerCase(), password, name.trim());
      await saveBabyProfile({
        name: babyName.trim(),
        birthday: formatDate(birthday),
        birthTime: formatTime(birthTime),
      });
      onSignup();
    } catch (e: any) {
      Alert.alert('회원가입 실패', e.message);
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
            <View style={styles.logoWrap}>
              <Ionicons name="heart" size={28} color={DS.primary} />
            </View>
            <Text style={styles.appName}>아가로그</Text>
          </View>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
          </View>
          <View style={styles.stepLabelRow}>
            <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>계정 정보</Text>
            <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>아기 정보</Text>
          </View>

          {step === 1 ? (
            <View style={styles.form}>
              <Text style={styles.formTitle}>계정 만들기</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>이름</Text>
                <TextInput
                  style={styles.input}
                  placeholder="홍길동"
                  placeholderTextColor={DS.textLight}
                  value={name}
                  onChangeText={setName}
                />
              </View>

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
                  placeholder="6자 이상"
                  placeholderTextColor={DS.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>비밀번호 확인</Text>
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호를 다시 입력"
                  placeholderTextColor={DS.textLight}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => { if (validateStep1()) setStep(2); }}
              >
                <Text style={styles.primaryBtnText}>다음</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.formTitle}>아기 정보 입력</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>아기 이름</Text>
                <TextInput
                  style={styles.input}
                  placeholder="예) 김아가"
                  placeholderTextColor={DS.textLight}
                  value={babyName}
                  onChangeText={setBabyName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>생일</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.pickerBtnInner}>
                    <Ionicons name="calendar-outline" size={18} color={DS.primary} />
                    <Text style={styles.pickerBtnText}>{formatDisplayDate(birthday)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={DS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>태어난 시간</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowTimePicker(true)}
                >
                  <View style={styles.pickerBtnInner}>
                    <Ionicons name="time-outline" size={18} color={DS.primary} />
                    <Text style={styles.pickerBtnText}>{formatDisplayTime(birthTime)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={DS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setStep(1)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="chevron-back" size={16} color={DS.textSub} />
                    <Text style={styles.secondaryBtnText}>이전</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, marginLeft: 10 }, loading && { opacity: 0.7 }]}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>가입 완료</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Login link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={onGoLogin}>
              <Text style={styles.footerLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS date picker */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalInner}>
              <Text style={styles.pickerModalTitle}>생일 선택</Text>
              <DateTimePicker
                value={birthday}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                onChange={(_, date) => { if (date) setBirthday(date); }}
                locale="ko-KR"
              />
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.pickerDoneBtnText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={birthday}
          mode="date"
          display="calendar"
          maximumDate={new Date()}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setBirthday(date);
          }}
        />
      )}
      {showDatePicker && Platform.OS === 'web' && (
        <Modal transparent animationType="fade">
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalInner}>
              <Text style={styles.pickerModalTitle}>생일 선택</Text>
              <DateTimePicker
                value={birthday}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setBirthday(date);
                }}
              />
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.pickerDoneBtnText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Time picker */}
      {showTimePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalInner}>
              <Text style={styles.pickerModalTitle}>태어난 시간</Text>
              <DateTimePicker
                value={birthTime}
                mode="time"
                display="spinner"
                onChange={(_, date) => { if (date) setBirthTime(date); }}
                locale="ko-KR"
              />
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.pickerDoneBtnText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={birthTime}
          mode="time"
          display="default"
          onChange={(_, date) => {
            setShowTimePicker(false);
            if (date) setBirthTime(date);
          }}
        />
      )}
      {showTimePicker && Platform.OS === 'web' && (
        <Modal transparent animationType="fade">
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalInner}>
              <Text style={styles.pickerModalTitle}>태어난 시간</Text>
              <DateTimePicker
                value={birthTime}
                mode="time"
                display="default"
                onChange={(_, date) => {
                  setShowTimePicker(false);
                  if (date) setBirthTime(date);
                }}
              />
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.pickerDoneBtnText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.bg },
  scroll: { flexGrow: 1, paddingHorizontal: DS.px, paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 36, paddingBottom: 20 },
  logoWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: DS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  appName: { fontSize: 28, fontWeight: '800', color: DS.text, letterSpacing: -0.5 },

  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: DS.border },
  stepDotActive: { backgroundColor: DS.primary, width: 28, borderRadius: 7 },
  stepLine: { width: 48, height: 2, backgroundColor: DS.border, marginHorizontal: 8 },
  stepLabelRow: { flexDirection: 'row', justifyContent: 'center', gap: 72, marginBottom: 20 },
  stepLabel: { fontSize: 12, color: DS.textLight, fontWeight: '600' },
  stepLabelActive: { color: DS.primary },

  form: {
    backgroundColor: DS.surface, borderRadius: DS.radius,
    padding: 24, marginBottom: 20,
    ...cardShadow,
  },
  formTitle: { fontSize: 20, fontWeight: '800', color: DS.text, marginBottom: 20 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: DS.textSub, marginBottom: 6 },
  input: {
    backgroundColor: DS.bg,
    borderRadius: DS.radiusSm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: DS.text,
    borderWidth: 1,
    borderColor: DS.border,
  },

  pickerBtn: {
    backgroundColor: DS.bg,
    borderRadius: DS.radiusSm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: DS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerBtnText: { fontSize: 15, color: DS.text },

  btnRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtn: {
    backgroundColor: DS.primary,
    borderRadius: DS.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    borderRadius: DS.radiusSm,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.border,
    backgroundColor: DS.surface,
  },
  secondaryBtnText: { color: DS.textSub, fontWeight: '700', fontSize: 15 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: DS.textSub, fontSize: 14 },
  footerLink: { color: DS.primary, fontWeight: '700', fontSize: 14 },

  pickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerModalInner: {
    backgroundColor: DS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  pickerModalTitle: { fontSize: 17, fontWeight: '800', color: DS.text, marginBottom: 12, textAlign: 'center' },
  pickerDoneBtn: {
    backgroundColor: DS.primary,
    borderRadius: DS.radiusSm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  pickerDoneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
