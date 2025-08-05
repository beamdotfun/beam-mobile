import React from 'react';
import {View, ScrollView} from 'react-native';
import {
  AlertTriangle,
  Ban,
  DollarSign,
  Shield,
  MessageSquareX,
  Users,
  AlertCircle,
  Zap,
} from 'lucide-react-native';
import {Card} from '../ui/card';
import {Text} from '../ui/text';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {ReportCategory, ReportSeverity} from '../../types/advanced-moderation';
import {cn} from '../../lib/utils';

interface ReportCategorySelectorProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

// Mock report categories - in real app, fetch from backend
const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'spam',
    name: 'Spam',
    description:
      'Unwanted repetitive content, excessive posting, or automated messages',
    severity: 'medium',
    requiredEvidence: ['screenshot', 'description'],
    autoActions: ['flag_for_review'],
    threshold: 5,
  },
  {
    id: 'fraud',
    name: 'Fraud or Scam',
    description: 'Deceptive content, phishing attempts, or financial scams',
    severity: 'critical',
    requiredEvidence: ['screenshot', 'url', 'description'],
    autoActions: ['auto_remove', 'require_verification'],
    threshold: 2,
  },
  {
    id: 'harassment',
    name: 'Harassment',
    description: 'Targeted harassment, bullying, or threatening behavior',
    severity: 'high',
    requiredEvidence: ['screenshot', 'description'],
    autoActions: ['escalate_priority', 'flag_for_review'],
    threshold: 3,
  },
  {
    id: 'inappropriate',
    name: 'Inappropriate Content',
    description:
      'Adult content, violence, or content violating community standards',
    severity: 'high',
    requiredEvidence: ['screenshot'],
    autoActions: ['auto_remove'],
    threshold: 3,
  },
  {
    id: 'impersonation',
    name: 'Impersonation',
    description: 'Pretending to be someone else or a legitimate entity',
    severity: 'high',
    requiredEvidence: ['screenshot', 'url', 'description'],
    autoActions: ['require_verification', 'escalate_priority'],
    threshold: 2,
  },
  {
    id: 'misinformation',
    name: 'Misinformation',
    description: 'Deliberately false or misleading information',
    severity: 'medium',
    requiredEvidence: ['url', 'description'],
    autoActions: ['flag_for_review'],
    threshold: 5,
  },
  {
    id: 'illegal',
    name: 'Illegal Activity',
    description: 'Content promoting or facilitating illegal activities',
    severity: 'critical',
    requiredEvidence: ['screenshot', 'description', 'blockchain_tx'],
    autoActions: ['auto_remove', 'escalate_priority'],
    threshold: 1,
  },
  {
    id: 'other',
    name: 'Other Violation',
    description:
      "Content that violates guidelines but doesn't fit other categories",
    severity: 'low',
    requiredEvidence: ['description'],
    autoActions: ['flag_for_review'],
    threshold: 10,
  },
];

export const ReportCategorySelector: React.FC<ReportCategorySelectorProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'spam':
        return Ban;
      case 'fraud':
        return DollarSign;
      case 'harassment':
        return MessageSquareX;
      case 'inappropriate':
        return AlertTriangle;
      case 'impersonation':
        return Users;
      case 'misinformation':
        return AlertCircle;
      case 'illegal':
        return Shield;
      default:
        return Zap;
    }
  };

  const getSeverityColor = (severity: ReportSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
        };
      case 'high':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          border: 'border-orange-200',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
        };
      case 'low':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
        };
    }
  };

  const getAutoActionText = (actions: string[]) => {
    if (actions.includes('auto_remove')) {
      return 'Auto-removed if verified';
    } else if (actions.includes('escalate_priority')) {
      return 'Priority review';
    } else if (actions.includes('require_verification')) {
      return 'Requires verification';
    } else {
      return 'Manual review';
    }
  };

  return (
    <ScrollView className="space-y-3" showsVerticalScrollIndicator={false}>
      {REPORT_CATEGORIES.map(category => {
        const Icon = getCategoryIcon(category.id);
        const severityColors = getSeverityColor(category.severity);
        const isSelected = selectedCategoryId === category.id;

        return (
          <Card
            key={category.id}
            className={cn(
              'p-4',
              isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white',
            )}>
            <Button
              variant="ghost"
              onPress={() => onSelectCategory(category.id)}
              className="w-full p-0 h-auto">
              <View className="w-full">
                <View className="flex-row items-start space-x-3">
                  <View
                    className={cn(
                      'w-10 h-10 rounded-lg items-center justify-center',
                      isSelected ? 'bg-blue-500' : severityColors.bg,
                    )}>
                    <Icon
                      size={20}
                      color={
                        isSelected
                          ? '#FFFFFF'
                          : severityColors.text.replace('text-', '#')
                      }
                    />
                  </View>

                  <View className="flex-1 space-y-2">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={cn(
                          'font-semibold text-lg',
                          isSelected ? 'text-blue-700' : 'text-gray-900',
                        )}>
                        {category.name}
                      </Text>
                      <Badge
                        variant="secondary"
                        className={cn(
                          severityColors.bg,
                          severityColors.border,
                        )}>
                        <Text
                          className={cn(
                            'text-xs capitalize',
                            severityColors.text,
                          )}>
                          {category.severity}
                        </Text>
                      </Badge>
                    </View>

                    <Text
                      className={cn(
                        'text-sm',
                        isSelected ? 'text-blue-600' : 'text-gray-600',
                      )}>
                      {category.description}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-gray-500">
                        {getAutoActionText(category.autoActions)}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Threshold: {category.threshold} reports
                      </Text>
                    </View>

                    {/* Required Evidence */}
                    <View className="flex-row flex-wrap gap-1">
                      <Text className="text-xs text-gray-500">Required: </Text>
                      {category.requiredEvidence.map(evidence => (
                        <Badge
                          key={evidence}
                          variant="outline"
                          className="px-2 py-0">
                          <Text className="text-xs capitalize">
                            {evidence.replace('_', ' ')}
                          </Text>
                        </Badge>
                      ))}
                    </View>
                  </View>
                </View>

                {isSelected && (
                  <View className="mt-3 p-2 bg-blue-100 rounded">
                    <Text className="text-xs text-blue-700">
                      ✓ Selected - Make sure to provide all required evidence
                    </Text>
                  </View>
                )}
              </View>
            </Button>
          </Card>
        );
      })}
    </ScrollView>
  );
};
