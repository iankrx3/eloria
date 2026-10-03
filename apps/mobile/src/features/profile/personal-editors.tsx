import {
  addPersonalItem,
  NAME_MAX,
  PEOPLE_MAX,
  PERSON_RELATION,
  PERSONAL_ITEM_MAX,
  PERSONAL_LIST_MAX,
  TONE,
  type Person,
} from '@eloria/shared';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

const inputClass =
  'min-h-[48px] flex-1 rounded-field border border-rose bg-dawn px-4 text-[16px] text-plum-deep';

/** 마이 탭 섹션 카드 */
export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-card bg-surface p-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-[13px] text-ink-muted">
          {title}
        </Text>
        {hint && <Text className="text-[13px] text-ink-muted">{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

function SmallButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      className={`h-12 items-center justify-center rounded-full px-4 ${disabled ? 'bg-dawn-2' : 'bg-plum'}`}
    >
      {loading ? (
        <ActivityIndicator color={tokens.colors['on-dusk']} />
      ) : (
        <Text className={`text-[13px] ${disabled ? 'text-ink-muted' : 'text-on-dusk'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** 부를 이름. 바꾼 값이 있을 때만 저장 버튼이 켜진다. */
export function NameEditor({
  value,
  saving,
  onSave,
}: {
  value: string;
  saving: boolean;
  onSave: (name: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const trimmed = draft.trim();
  const changed = trimmed.length > 0 && trimmed !== value;

  return (
    <View className="flex-row items-center gap-2">
      <TextInput
        value={draft}
        onChangeText={setDraft}
        maxLength={NAME_MAX}
        accessibilityLabel={ko.me.name}
        placeholder={ko.quiz.questions.name.placeholder}
        placeholderTextColor={tokens.colors['ink-muted']}
        returnKeyType="done"
        onSubmitEditing={() => changed && onSave(trimmed)}
        className={inputClass}
      />
      <SmallButton
        label={ko.me.save}
        disabled={!changed}
        loading={saving}
        onPress={() => onSave(trimmed)}
      />
    </View>
  );
}

/** 스토리 톤(퀴즈 9번과 같은 선택지). 누르는 즉시 저장한다. */
export function TonePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (tone: (typeof TONE)[number]) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row gap-2">
      {TONE.map((t) => (
        <Pressable
          key={t}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === t }}
          accessibilityLabel={ko.quiz.questions.tone.options[t]}
          onPress={() => onChange(t)}
          className={`flex-1 items-center rounded-full border py-3 ${
            value === t ? 'border-plum bg-plum' : 'border-rose bg-dawn'
          }`}
        >
          <Text className={`text-[13px] ${value === t ? 'text-on-dusk' : 'text-plum-deep'}`}>
            {ko.quiz.questions.tone.options[t]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-dawn-2 py-1 pl-3 pr-1">
      <Text className="text-[13px] text-plum-deep">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.me.remove(label)}
        hitSlop={8}
        onPress={onRemove}
        className="h-7 w-7 items-center justify-center"
      >
        <SymbolView
          name={{ ios: 'xmark', android: 'close' }}
          size={14}
          tintColor={tokens.colors['ink-muted']}
        />
      </Pressable>
    </View>
  );
}

/** 좋아하는 것·싫어하는 것. 더하거나 지우는 즉시 전체 목록을 저장한다. */
export function ChipListEditor({
  items,
  placeholder,
  onChange,
}: {
  items: readonly string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const full = items.length >= PERSONAL_LIST_MAX;

  const add = () => {
    const next = addPersonalItem(items, draft);
    if (next.length !== items.length) onChange(next);
    setDraft('');
  };

  return (
    <View className="gap-3">
      {items.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {items.map((item) => (
            <Chip
              key={item}
              label={item}
              onRemove={() => onChange(items.filter((i) => i !== item))}
            />
          ))}
        </View>
      ) : (
        <Text className="text-[13px] text-ink-muted">{ko.me.listEmpty}</Text>
      )}
      {full ? (
        <Text className="text-[13px] text-ink-muted">{ko.me.limit(PERSONAL_LIST_MAX)}</Text>
      ) : (
        <View className="flex-row items-center gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            maxLength={PERSONAL_ITEM_MAX}
            placeholder={placeholder}
            placeholderTextColor={tokens.colors['ink-muted']}
            accessibilityLabel={placeholder}
            returnKeyType="done"
            onSubmitEditing={add}
            className={inputClass}
          />
          <SmallButton label={ko.me.add} disabled={draft.trim().length === 0} onPress={add} />
        </View>
      )}
    </View>
  );
}

/** 소중한 사람 목록과 추가 입력 */
export function PeopleEditor({
  people,
  adding,
  onAdd,
  onRemove,
}: {
  people: readonly (Person & { id: string })[];
  adding: boolean;
  onAdd: (person: Person) => void;
  onRemove: (id: string) => void;
}) {
  const t = ko.quiz.questions.people;
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Person['relation']>('partner');
  const full = people.length >= PEOPLE_MAX;

  const add = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), relation });
    setName('');
  };

  return (
    <View className="gap-3">
      {people.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {people.map((p) => (
            <Chip
              key={p.id}
              label={`${p.name} · ${t.relations[p.relation]}`}
              onRemove={() => onRemove(p.id)}
            />
          ))}
        </View>
      ) : (
        <Text className="text-[13px] text-ink-muted">{ko.me.peopleEmpty}</Text>
      )}
      {full ? (
        <Text className="text-[13px] text-ink-muted">{ko.me.limit(PEOPLE_MAX)}</Text>
      ) : (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={NAME_MAX}
              placeholder={t.namePlaceholder}
              placeholderTextColor={tokens.colors['ink-muted']}
              accessibilityLabel={t.namePlaceholder}
              returnKeyType="done"
              onSubmitEditing={add}
              className={inputClass}
            />
            <SmallButton
              label={ko.me.add}
              disabled={name.trim().length === 0}
              loading={adding}
              onPress={add}
            />
          </View>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {PERSON_RELATION.map((r) => (
              <Pressable
                key={r}
                accessibilityRole="radio"
                accessibilityState={{ selected: relation === r }}
                accessibilityLabel={t.relations[r]}
                onPress={() => setRelation(r)}
                className={`rounded-full border px-3 py-1.5 ${
                  relation === r ? 'border-plum bg-plum' : 'border-rose bg-dawn'
                }`}
              >
                <Text
                  className={`text-[13px] ${relation === r ? 'text-on-dusk' : 'text-plum-deep'}`}
                >
                  {t.relations[r]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
