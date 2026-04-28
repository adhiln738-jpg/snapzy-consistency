window.COS = window.COS || {};

COS.RolePresets = (function () {
  const PRESETS = {
    Student: [
      { icon: '📚', name: 'Read 1 Hour', category: 'Learning', frequency: 'daily' },
      { icon: '📝', name: 'Study Sessions', category: 'Learning', frequency: 'daily' },
      { icon: '📵', name: 'No Social Media AM', category: 'Mindfulness', frequency: 'daily' },
      { icon: '🏋️', name: 'Exercise', category: 'Health', frequency: 'daily' },
      { icon: '💤', name: 'Sleep 8 Hours', category: 'Health', frequency: 'daily' },
      { icon: '🔁', name: 'Review Notes', category: 'Learning', frequency: 'weekdays' },
      { icon: '💧', name: 'Drink 8 Glasses Water', category: 'Health', frequency: 'daily' },
    ],
    Founder: [
      { icon: '🎯', name: 'Deep Work 3hrs', category: 'Work', frequency: 'weekdays' },
      { icon: '📊', name: 'Review Metrics', category: 'Work', frequency: 'weekdays' },
      { icon: '🚫', name: 'No Meeting Mornings', category: 'Work', frequency: 'weekdays' },
      { icon: '🏋️', name: 'Exercise', category: 'Health', frequency: 'daily' },
      { icon: '📖', name: 'Read Industry News', category: 'Learning', frequency: 'daily' },
      { icon: '📩', name: 'Cold Outreach', category: 'Work', frequency: 'weekdays' },
      { icon: '📝', name: 'Reflect / Journal', category: 'Mindfulness', frequency: 'daily' },
    ],
    Freelancer: [
      { icon: '💻', name: 'Client Work Block', category: 'Work', frequency: 'weekdays' },
      { icon: '📚', name: 'Skill Learning', category: 'Learning', frequency: 'daily' },
      { icon: '🎨', name: 'Portfolio Update', category: 'Work', frequency: 'daily' },
      { icon: '🏋️', name: 'Exercise', category: 'Health', frequency: 'daily' },
      { icon: '☀️', name: 'Morning Routine', category: 'Mindfulness', frequency: 'daily' },
      { icon: '💰', name: 'Income Tracking', category: 'Finance', frequency: 'daily' },
      { icon: '🤝', name: 'Networking', category: 'Social', frequency: 'weekdays' },
    ],
    Worker: [
      { icon: '☀️', name: 'Morning Routine', category: 'Mindfulness', frequency: 'daily' },
      { icon: '🎯', name: 'Focus Work', category: 'Work', frequency: 'weekdays' },
      { icon: '📥', name: 'Inbox Zero', category: 'Work', frequency: 'weekdays' },
      { icon: '🚶', name: 'Lunch Walk', category: 'Health', frequency: 'weekdays' },
      { icon: '📵', name: 'No Late Screens', category: 'Health', frequency: 'daily' },
      { icon: '🙏', name: 'Gratitude Journal', category: 'Mindfulness', frequency: 'daily' },
      { icon: '🔄', name: 'Weekend Reset', category: 'Mindfulness', frequency: [0, 6] },
    ],
    Creator: [
      { icon: '🎨', name: 'Create Daily', category: 'Work', frequency: 'daily' },
      { icon: '📣', name: 'Post Content', category: 'Work', frequency: 'daily' },
      { icon: '💬', name: 'Engage Audience', category: 'Social', frequency: 'daily' },
      { icon: '🔧', name: 'Learn New Tool', category: 'Learning', frequency: 'daily' },
      { icon: '🏋️', name: 'Exercise', category: 'Health', frequency: 'daily' },
      { icon: '📝', name: 'Reflect', category: 'Mindfulness', frequency: 'daily' },
      { icon: '🗂️', name: 'Batch Plan', category: 'Work', frequency: [0, 6] },
    ],
  };

  function applyPreset(role) {
    const templates = PRESETS[role] || [];
    const habits = templates.map(t => ({
      id: COS.Data.generateId(),
      name: t.name,
      icon: t.icon,
      category: t.category,
      frequency: t.frequency,
      createdAt: Date.now()
    }));
    COS.Data.saveHabits(habits);
    return habits;
  }

  return { PRESETS, applyPreset };
})();
