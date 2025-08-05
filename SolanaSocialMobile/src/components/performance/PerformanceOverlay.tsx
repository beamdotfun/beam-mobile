import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  X,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import {usePerformanceStore} from '../../store/performance';
import {performanceMonitor} from '../../services/performance';
import {useThemeStore} from '../../store/themeStore';
import {formatNumber} from '../../utils/formatting';

export function PerformanceOverlay() {
  const {colors} = useThemeStore();
  const {
    showDebugOverlay,
    toggleDebugOverlay,
    currentMetrics,
    recentIssues,
    isMonitoringEnabled,
    setMonitoring,
  } = usePerformanceStore();

  const [expanded, setExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'metrics' | 'issues'>(
    'metrics',
  );

  useEffect(() => {
    if (showDebugOverlay && !isMonitoringEnabled) {
      setMonitoring(true);
    }
  }, [showDebugOverlay, isMonitoringEnabled, setMonitoring]);

  if (!showDebugOverlay || !currentMetrics) {
    return null;
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 55) {
      return '#10B981';
    } // Green
    if (fps >= 30) {
      return '#F59E0B';
    } // Orange
    return '#EF4444'; // Red
  };

  const getMemoryColor = (percentage: number) => {
    if (percentage <= 60) {
      return '#10B981';
    }
    if (percentage <= 80) {
      return '#F59E0B';
    }
    return '#EF4444';
  };

  const criticalIssues = recentIssues.filter(i => i.severity === 'critical');
  const warningIssues = recentIssues.filter(i => i.severity === 'warning');

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Compact View */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.headerContent}>
          <View style={styles.metricsRow}>
            {/* FPS */}
            <View style={styles.metricItem}>
              <Activity
                size={14}
                color={getFPSColor(currentMetrics.fps.current)}
              />
              <Text
                style={[
                  styles.metricValue,
                  {color: getFPSColor(currentMetrics.fps.current)},
                ]}>
                {currentMetrics.fps.current} FPS
              </Text>
            </View>

            {/* Memory */}
            <View style={styles.metricItem}>
              <HardDrive
                size={14}
                color={getMemoryColor(currentMetrics.memory.percentage)}
              />
              <Text
                style={[
                  styles.metricValue,
                  {color: getMemoryColor(currentMetrics.memory.percentage)},
                ]}>
                {currentMetrics.memory.percentage}%
              </Text>
            </View>

            {/* Issues */}
            {criticalIssues.length > 0 && (
              <View style={styles.metricItem}>
                <AlertTriangle size={14} color="#EF4444" />
                <Text style={[styles.metricValue, {color: '#EF4444'}]}>
                  {criticalIssues.length}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {expanded ? (
              <ChevronUp size={16} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={16} color={colors.mutedForeground} />
            )}
            <Pressable
              onPress={toggleDebugOverlay}
              hitSlop={8}
              style={styles.closeButton}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      </Pressable>

      {/* Expanded View */}
      {expanded && (
        <View
          style={[
            styles.expandedContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}>
          {/* Tab Selector */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setSelectedTab('metrics')}
              style={[
                styles.tab,
                selectedTab === 'metrics' && styles.activeTab,
                selectedTab === 'metrics' && {borderColor: colors.primary},
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {color: colors.foreground},
                  selectedTab === 'metrics' && {color: colors.primary},
                ]}>
                Metrics
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab('issues')}
              style={[
                styles.tab,
                selectedTab === 'issues' && styles.activeTab,
                selectedTab === 'issues' && {borderColor: colors.primary},
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {color: colors.foreground},
                  selectedTab === 'issues' && {color: colors.primary},
                ]}>
                Issues ({recentIssues.length})
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.tabContent}>
            {selectedTab === 'metrics' ? (
              <View>
                {/* FPS Details */}
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, {color: colors.foreground}]}>
                    Frame Rate
                  </Text>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Current
                    </Text>
                    <Text
                      style={[
                        styles.value,
                        {color: getFPSColor(currentMetrics.fps.current)},
                      ]}>
                      {currentMetrics.fps.current} FPS
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Average
                    </Text>
                    <Text style={[styles.value, {color: colors.foreground}]}>
                      {currentMetrics.fps.average} FPS
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Drops
                    </Text>
                    <Text style={[styles.value, {color: colors.foreground}]}>
                      {currentMetrics.fps.drops}
                    </Text>
                  </View>
                </View>

                {/* Memory Details */}
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, {color: colors.foreground}]}>
                    Memory
                  </Text>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Used
                    </Text>
                    <Text style={[styles.value, {color: colors.foreground}]}>
                      {currentMetrics.memory.used} MB
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Total
                    </Text>
                    <Text style={[styles.value, {color: colors.foreground}]}>
                      {currentMetrics.memory.limit} MB
                    </Text>
                  </View>
                  {currentMetrics.memory.leaks.length > 0 && (
                    <View style={styles.detailRow}>
                      <Text
                        style={[styles.label, {color: colors.mutedForeground}]}>
                        Leaks
                      </Text>
                      <Text style={[styles.value, {color: '#EF4444'}]}>
                        {currentMetrics.memory.leaks.length}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Network Details */}
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, {color: colors.foreground}]}>
                    Network
                  </Text>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Requests
                    </Text>
                    <Text style={[styles.value, {color: colors.foreground}]}>
                      {currentMetrics.network.requests}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Failed
                    </Text>
                    <Text
                      style={[
                        styles.value,
                        {
                          color:
                            currentMetrics.network.failedRequests > 0
                              ? '#EF4444'
                              : colors.foreground,
                        },
                      ]}>
                      {currentMetrics.network.failedRequests}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Avg Latency
                    </Text>
                    <Text style={[styles.value, {color: colors.foreground}]}>
                      {currentMetrics.network.averageLatency} ms
                    </Text>
                  </View>
                </View>

                {/* Render Details */}
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, {color: colors.foreground}]}>
                    Rendering
                  </Text>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, {color: colors.mutedForeground}]}>
                      Unnecessary
                    </Text>
                    <Text style={[styles.value, {color: colors.foreground}]}>
                      {currentMetrics.render.unnecessaryRenders}
                    </Text>
                  </View>
                  {currentMetrics.render.slowComponents.length > 0 && (
                    <View style={styles.slowComponents}>
                      <Text
                        style={[styles.label, {color: colors.mutedForeground}]}>
                        Slow Components:
                      </Text>
                      {currentMetrics.render.slowComponents.map(comp => (
                        <Text
                          key={comp}
                          style={[styles.slowComponent, {color: '#F59E0B'}]}>
                          • {comp}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View>
                {recentIssues.length === 0 ? (
                  <Text
                    style={[styles.noIssues, {color: colors.mutedForeground}]}>
                    No performance issues detected
                  </Text>
                ) : (
                  recentIssues.map((issue, index) => (
                    <View
                      key={index}
                      style={[
                        styles.issue,
                        {
                          borderColor: colors.border,
                          backgroundColor:
                            issue.severity === 'critical'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : issue.severity === 'warning'
                              ? 'rgba(245, 158, 11, 0.1)'
                              : 'transparent',
                        },
                      ]}>
                      <View style={styles.issueHeader}>
                        <AlertTriangle
                          size={14}
                          color={
                            issue.severity === 'critical'
                              ? '#EF4444'
                              : issue.severity === 'warning'
                              ? '#F59E0B'
                              : colors.mutedForeground
                          }
                        />
                        <Text
                          style={[
                            styles.issueType,
                            {
                              color:
                                issue.severity === 'critical'
                                  ? '#EF4444'
                                  : issue.severity === 'warning'
                                  ? '#F59E0B'
                                  : colors.foreground,
                            },
                          ]}>
                          {issue.type.toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[styles.issueDesc, {color: colors.foreground}]}>
                        {issue.description}
                      </Text>
                      {issue.solution && (
                        <Text
                          style={[
                            styles.issueSolution,
                            {color: colors.mutedForeground},
                          ]}>
                          💡 {issue.solution}
                        </Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 400,
    width: 300,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContent: {
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 12,
    fontWeight: '500',
  },
  slowComponents: {
    marginTop: 8,
  },
  slowComponent: {
    fontSize: 11,
    marginLeft: 12,
    marginTop: 2,
  },
  noIssues: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  issue: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueType: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  issueDesc: {
    fontSize: 12,
    marginBottom: 4,
  },
  issueSolution: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
