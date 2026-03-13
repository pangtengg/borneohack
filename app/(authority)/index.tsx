import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth/AuthContext';
import { Colors } from '../../constants/colors';
import { getAllReports, updateReportStatus } from '../../lib/supabase';

export default function AuthorityDashboardScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchReports = async () => {
    try {
      const data = await getAllReports();
      console.log(`Fetched ${data?.length || 0} reports`);
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', `Failed to fetch reports. ${error?.message || JSON.stringify(error) || ''}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          } 
        },
      ]
    );
  };

  const handleStatusUpdate = (report: any) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const updateStatus = async (status: string) => {
    if (!selectedReport) return;
    
    try {
      setLoading(true);
      setModalVisible(false);
      await updateReportStatus(selectedReport.id, status);
      await fetchReports();
    } catch (err) {
      console.error('Failed to update status', err);
      Alert.alert('Error', 'Failed to update report status.');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return '#10B981'; // green
      case 'responded':
      case 'responding': return '#F59E0B'; // yellow
      case 'pending': 
      default: return '#EF4444'; // red
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Incoming Reports</Text>
        <Text style={styles.subtitle}>View reports, add notes, update status</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40, marginBottom: 40 }} />
      ) : reports.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No reports yet.</Text>
          <Text style={styles.placeholderHint}>When a survivor submits a report, it will appear here.</Text>
        </View>
      ) : (
        <View style={styles.reportsList}>
          {reports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportCategory}>{report.category || 'General'}</Text>
                <TouchableOpacity 
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}
                  onPress={() => handleStatusUpdate(report)}
                >
                  <Text style={styles.statusText}>{report.status || 'pending'}</Text>
                </TouchableOpacity>
              </View>
              
              {!!report.description && (
                <Text style={styles.reportDescription}>{report.description}</Text>
              )}
              {!!report.translation && (
                <Text style={styles.reportTranslation}>Translation: {report.translation}</Text>
              )}
              
              {(report.profile || report.survivor_profile) && (
                <View style={styles.senderDetails}>
                  <Text style={styles.senderTitle}>Sender Profile</Text>
                  {report.survivor_profile?.display_name && (
                    <Text style={styles.senderText}>
                      <Text style={{ fontWeight: '600' }}>Name: </Text>
                      {report.survivor_profile.display_name}
                      {report.profile?.legal_name && report.profile.legal_name !== report.survivor_profile.display_name 
                        ? ` (${report.profile.legal_name})` : ''}
                    </Text>
                  )}
                  {report.profile?.age || report.profile?.gender ? (
                    <Text style={styles.senderText}>
                      <Text style={{ fontWeight: '600' }}>Demographics: </Text>
                      {[
                        report.profile?.gender,
                        report.profile?.age ? `${report.profile.age} yrs` : null
                      ].filter(Boolean).join(', ')}
                    </Text>
                  ) : null}
                  {report.profile?.medical_conditions && (
                    <Text style={styles.senderText}>
                      <Text style={{ fontWeight: '600' }}>Medical info: </Text>
                      {report.profile.medical_conditions}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.reportFooter}>
                <Text style={styles.reportDate}>
                  {new Date(report.created_at).toLocaleString()}
                </Text>
                {report.urgency && (
                  <Text style={styles.reportUrgency}>Urgency: {report.urgency}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Report Status</Text>
            <Text style={styles.modalSubtitle}>Select an action for this report</Text>
            
            <View style={styles.actionList}>
              <TouchableOpacity 
                style={[styles.actionButton, { borderLeftColor: '#EF4444' }]} 
                onPress={() => updateStatus('pending')}
              >
                <Text style={styles.actionText}>Mark as Pending</Text>
                <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { borderLeftColor: '#F59E0B' }]} 
                onPress={() => updateStatus('responding')}
              >
                <Text style={styles.actionText}>Mark as Responding</Text>
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { borderLeftColor: '#10B981' }]} 
                onPress={() => updateStatus('resolved')}
              >
                <Text style={styles.actionText}>Mark as Resolved</Text>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              </TouchableOpacity>

              {selectedReport?.latitude && selectedReport?.longitude && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderLeftColor: Colors.info }]} 
                  onPress={() => {
                    setModalVisible(false);
                    const url = `https://www.google.com/maps/search/?api=1&query=${selectedReport.latitude},${selectedReport.longitude}`;
                    Linking.openURL(url);
                  }}
                >
                  <Text style={styles.actionText}>View on Map</Text>
                  <View style={[styles.statusDot, { backgroundColor: Colors.info }]} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, gap: 4 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 16 },
  placeholder: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  placeholderText: { color: Colors.textMuted, fontSize: 18, fontWeight: '600' },
  placeholderHint: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  reportsList: {
    gap: 16,
    marginBottom: 32,
  },
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportCategory: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reportDescription: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  reportTranslation: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 8,
  },
  senderDetails: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  senderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  senderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  reportDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  reportUrgency: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  signOutBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  actionList: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
