interface ConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'merge' | 'manual';
  resolvedData?: any;
  conflicts?: ConflictDetail[];
}

interface ConflictDetail {
  field: string;
  clientValue: any;
  serverValue: any;
  resolution?: any;
}

// Simple diff implementation since we don't have deep-object-diff
function diff(obj1: any, obj2: any): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (!obj1.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
        result[key] = obj2[key];
      }
    }
  }

  return result;
}

class ConflictResolver {
  resolve(
    clientData: any,
    serverData: any,
    strategy: ConflictResolution['strategy'],
    rules?: ConflictRules,
  ): ConflictResolution {
    switch (strategy) {
      case 'client_wins':
        return {strategy, resolvedData: clientData};

      case 'server_wins':
        return {strategy, resolvedData: serverData};

      case 'merge':
        return this.autoMerge(clientData, serverData, rules);

      case 'manual':
        return this.detectConflicts(clientData, serverData);

      default:
        return {strategy: 'server_wins', resolvedData: serverData};
    }
  }

  private autoMerge(
    clientData: any,
    serverData: any,
    rules?: ConflictRules,
  ): ConflictResolution {
    const differences = diff(serverData, clientData);
    const conflicts: ConflictDetail[] = [];
    const resolvedData = {...serverData};

    for (const [field, clientValue] of Object.entries(differences)) {
      const serverValue = serverData[field];

      // Apply rules if available
      if (rules?.[field]) {
        const resolution = rules[field](clientValue, serverValue);
        resolvedData[field] = resolution;
      } else {
        // Default merge strategy
        if (this.isTimestamp(field)) {
          // Keep newer timestamp
          resolvedData[field] = Math.max(clientValue as number, serverValue);
        } else if (Array.isArray(clientValue) && Array.isArray(serverValue)) {
          // Merge arrays
          resolvedData[field] = [...new Set([...serverValue, ...clientValue])];
        } else if (
          typeof clientValue === 'number' &&
          typeof serverValue === 'number'
        ) {
          // For counters, use the higher value
          resolvedData[field] = Math.max(clientValue, serverValue);
        } else {
          // Client wins for other fields
          resolvedData[field] = clientValue;
          conflicts.push({field, clientValue, serverValue});
        }
      }
    }

    return {strategy: 'merge', resolvedData, conflicts};
  }

  private detectConflicts(
    clientData: any,
    serverData: any,
  ): ConflictResolution {
    const differences = diff(serverData, clientData);
    const conflicts: ConflictDetail[] = [];

    for (const [field, clientValue] of Object.entries(differences)) {
      conflicts.push({
        field,
        clientValue,
        serverValue: serverData[field],
      });
    }

    return {strategy: 'manual', conflicts};
  }

  private isTimestamp(field: string): boolean {
    return (
      field.includes('At') || field.includes('_at') || field === 'timestamp'
    );
  }

  // Predefined merge strategies for common data types
  getCommonRules(): ConflictRules {
    return {
      // User profile updates
      username: (clientValue, serverValue) => clientValue, // Client wins
      bio: (clientValue, serverValue) => clientValue, // Client wins
      avatar: (clientValue, serverValue) => clientValue, // Client wins

      // Counters - take the maximum
      followerCount: (clientValue, serverValue) =>
        Math.max(clientValue, serverValue),
      followingCount: (clientValue, serverValue) =>
        Math.max(clientValue, serverValue),
      postCount: (clientValue, serverValue) =>
        Math.max(clientValue, serverValue),

      // Timestamps - take the newer one
      lastSeen: (clientValue, serverValue) =>
        Math.max(clientValue, serverValue),
      updatedAt: (clientValue, serverValue) =>
        Math.max(clientValue, serverValue),

      // Arrays - merge unique values
      tags: (clientValue, serverValue) => [
        ...new Set([...serverValue, ...clientValue]),
      ],
      mentions: (clientValue, serverValue) => [
        ...new Set([...serverValue, ...clientValue]),

      // Booleans - OR logic for flags
      isVerified: (clientValue, serverValue) => clientValue || serverValue,
      isOnline: (clientValue, serverValue) => clientValue || serverValue,
    };
  }

  // Create a conflict resolution for specific entity types
  createEntityResolver(
    entityType: 'post' | 'user' | 'group',
  ): (clientData: any, serverData: any) => ConflictResolution {
    const rules = this.getCommonRules();

    // Add entity-specific rules
    switch (entityType) {
      case 'post':
        return (clientData, serverData) =>
          this.resolve(clientData, serverData, 'merge', {
            ...rules,
            content: (clientValue, serverValue) => clientValue, // Client wins for content
            voteCount: (clientValue, serverValue) =>
              Math.max(clientValue, serverValue),
            commentCount: (clientValue, serverValue) =>
              Math.max(clientValue, serverValue),
          });

      case 'user':
        return (clientData, serverData) =>
          this.resolve(clientData, serverData, 'merge', {
            ...rules,
            email: (clientValue, serverValue) => serverValue, // Server wins for email
            walletAddress: (clientValue, serverValue) => serverValue, // Server wins for wallet
          });

      case 'group':
        return (clientData, serverData) =>
          this.resolve(clientData, serverData, 'merge', {
            ...rules,
            memberCount: (clientValue, serverValue) =>
              Math.max(clientValue, serverValue),
            name: (clientValue, serverValue) => clientValue, // Client wins for name changes
          });

      default:
        return (clientData, serverData) =>
          this.resolve(clientData, serverData, 'merge', rules);
    }
  }
}

export const conflictResolver = new ConflictResolver();

// Type for field-specific conflict resolution rules
export type ConflictRules = Record<
  string,
  (clientValue: any, serverValue: any) => any
>;

export type {ConflictResolution, ConflictDetail};
