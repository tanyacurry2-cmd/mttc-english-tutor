import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WRITING_PROMPTS } from '../data/writingPrompts';
import Constants from 'expo-constants';

interface Feedback {
  overall_score?: number;
  focus_purpose?: { score: number; comment: string };
  organization?: { score: number; comment: string };
  evidence_analysis?: { score: number; comment: string };
  language_conventions?: { score: number; comment: string };
  next_steps?: string;
}

export default function WritingLabScreen() {
  const router = useRouter();
  const [selectedPromptId, setSelectedPromptId] = useState(WRITING_PROMPTS[0].id);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState('');

  const selectedPrompt = WRITING_PROMPTS.find((p) => p.id === selectedPromptId);

  const handleSubmit = async () => {
    setError('');
    setFeedback(null);

    if (!responseText.trim()) {
      setError('Type a response before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';
      
      const res = await fetch(`${backendUrl}/api/grade-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: selectedPrompt?.id,
          promptText: selectedPrompt?.promptText,
          userResponse: responseText,
        }),
      });

      if (!res.ok) {
        throw new Error('Server error while grading response.');
      }

      const data = await res.json();
      setFeedback(data);
    } catch (e) {
      console.error(e);
      setError('There was a problem getting feedback. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = responseText.trim() ? responseText.trim().split(/\s+/).length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Writing Lab</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Practice constructed responses and get rubric-style feedback. This is for preparation only,
          not official MTTC scoring.
        </Text>

        {/* Prompt selector */}
        <Text style={styles.label}>Choose a prompt:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedPromptId}
            onValueChange={(value) => setSelectedPromptId(value)}
            style={styles.picker}
            dropdownIconColor="#cfe0ff"
          >
            {WRITING_PROMPTS.map((p) => (
              <Picker.Item key={p.id} label={p.label} value={p.id} />
            ))}
          </Picker>
        </View>

        {/* Prompt text */}
        <View style={styles.promptBox}>
          <Text style={styles.promptText}>{selectedPrompt?.promptText}</Text>
        </View>

        {/* User response */}
        <Text style={styles.label}>Your response:</Text>
        <TextInput
          multiline
          numberOfLines={10}
          style={styles.textArea}
          value={responseText}
          onChangeText={setResponseText}
          placeholder="Write your constructed response here..."
          placeholderTextColor="#888"
          textAlignVertical="top"
        />

        <Text style={styles.wordCount}>Word count: {wordCount}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit for AI Feedback</Text>
          )}
        </TouchableOpacity>

        {/* Feedback display */}
        {feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackTitle}>AI Feedback</Text>

            <Text style={styles.feedbackOverall}>
              Overall score: {feedback.overall_score ?? 'N/A'} / 4
            </Text>

            <View style={styles.criteriaList}>
              <CriterionItem
                title="Focus & Purpose"
                score={feedback.focus_purpose?.score}
                comment={feedback.focus_purpose?.comment}
              />
              <CriterionItem
                title="Organization & Coherence"
                score={feedback.organization?.score}
                comment={feedback.organization?.comment}
              />
              <CriterionItem
                title="Evidence & Analysis"
                score={feedback.evidence_analysis?.score}
                comment={feedback.evidence_analysis?.comment}
              />
              <CriterionItem
                title="Language & Conventions"
                score={feedback.language_conventions?.score}
                comment={feedback.language_conventions?.comment}
              />
            </View>

            {feedback.next_steps && (
              <View style={styles.nextStepsBox}>
                <Text style={styles.nextStepsTitle}>Next step to improve:</Text>
                <Text style={styles.nextStepsText}>{feedback.next_steps}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CriterionItem({
  title,
  score,
  comment,
}: {
  title: string;
  score?: number;
  comment?: string;
}) {
  return (
    <View style={styles.criterionItem}>
      <Text style={styles.criterionTitle}>
        {title}: {score ?? 'N/A'} / 4
      </Text>
      <Text style={styles.criterionComment}>{comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1526',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#0b1526',
    borderBottomWidth: 1,
    borderBottomColor: '#1a2a4d',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    color: '#cfe0ff',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#111c33',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a2a4d',
    overflow: 'hidden',
  },
  picker: {
    color: '#cfe0ff',
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  promptBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#111c33',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a2a4d',
  },
  promptText: {
    color: '#cfe0ff',
    fontSize: 13,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: '#111c33',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a2a4d',
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 200,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  wordCount: {
    color: '#98acd3',
    fontSize: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#ff5252',
    fontSize: 13,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#2a66ff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#111c33',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a66ff',
  },
  feedbackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  feedbackOverall: {
    color: '#cfe0ff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  criteriaList: {
    gap: 12,
  },
  criterionItem: {
    marginBottom: 12,
  },
  criterionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  criterionComment: {
    color: '#b9c7e6',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  nextStepsBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#1a2a4d',
    borderRadius: 8,
  },
  nextStepsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextStepsText: {
    color: '#cfe0ff',
    fontSize: 13,
    lineHeight: 18,
  },
});
