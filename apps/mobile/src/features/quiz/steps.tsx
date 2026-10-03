import { PERSON_RELATION, PEOPLE_MAX, type Person } from '@eloria/shared';
import * as Notifications from 'expo-notifications';
import { SymbolView } from 'expo-symbols';
import { useState, type ComponentProps } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '@/components/primary-button';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';
import { OptionCard } from './option-card';
import { QuizScaffold } from './quiz-scaffold';

type Scaffold = Omit<ComponentProps<typeof QuizScaffold>, 'children' | 'footer'>;
type Option<K extends string> = { key: K; label: string };

type StepProps<T> = {
  scaffold: Scaffold;
  initial?: T;
  pending: boolean;
  onSubmit: (answer: T) => void;
};

const inputClass =
  'min-h-[56px] rounded-field border border-rose bg-surface px-4 text-[16px] text-plum-deep';

/** 이름·자유 입력 */
export function TextStep({
  scaffold,
  initial,
  pending,
  onSubmit,
  maxLength,
  placeholder,
  multiline = false,
}: StepProps<string> & { maxLength: number; placeholder: string; multiline?: boolean }) {
  const [value, setValue] = useState(initial ?? '');
  const trimmed = value.trim();

  return (
    <QuizScaffold
      {...scaffold}
      footer={
        trimmed.length > 0 && (
          <PrimaryButton
            label={ko.common.next}
            loading={pending}
            onPress={() => onSubmit(trimmed)}
          />
        )
      }
    >
      <View className="gap-2">
        <TextInput
          value={value}
          onChangeText={setValue}
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors['ink-muted']}
          accessibilityLabel={placeholder}
          multiline={multiline}
          autoFocus
          returnKeyType={multiline ? 'default' : 'next'}
          onSubmitEditing={() => !multiline && trimmed && onSubmit(trimmed)}
          className={`${inputClass} ${multiline ? 'min-h-[120px] py-4' : ''}`}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        <Text className="self-end text-[13px] text-ink-muted">
          {ko.quiz.counter(value.length, maxLength)}
        </Text>
      </View>
    </QuizScaffold>
  );
}

/** 단일 선택: 누르면 바로 저장하고 다음 문항으로 간다(DESIGN 4절). */
export function SingleStep<K extends string>({
  scaffold,
  initial,
  pending,
  onSubmit,
  options,
}: StepProps<K> & { options: Option<K>[] }) {
  const [picked, setPicked] = useState<K | undefined>(initial);

  return (
    <QuizScaffold {...scaffold}>
      <View className="gap-3">
        {options.map((o) => (
          <OptionCard
            key={o.key}
            mode="single"
            label={o.label}
            selected={picked === o.key}
            disabled={pending}
            onPress={() => {
              setPicked(o.key);
              onSubmit(o.key);
            }}
          />
        ))}
      </View>
    </QuizScaffold>
  );
}

/** 복수 선택(최대 개수 제한 가능) */
export function MultiStep<K extends string>({
  scaffold,
  initial,
  pending,
  onSubmit,
  options,
  max,
}: StepProps<K[]> & { options: Option<K>[]; max?: number }) {
  const [picked, setPicked] = useState<K[]>(initial ?? []);
  const limit = max ?? options.length;

  const toggle = (key: K) =>
    setPicked((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length < limit
          ? [...prev, key]
          : prev,
    );

  return (
    <QuizScaffold
      {...scaffold}
      helper={max ? ko.quiz.maxHint(max) : ko.quiz.multiHint}
      footer={
        picked.length > 0 && (
          <PrimaryButton
            label={ko.common.next}
            loading={pending}
            onPress={() => onSubmit(picked)}
          />
        )
      }
    >
      <View className="gap-3">
        {options.map((o) => (
          <OptionCard
            key={o.key}
            mode="multi"
            label={o.label}
            selected={picked.includes(o.key)}
            onPress={() => toggle(o.key)}
          />
        ))}
      </View>
    </QuizScaffold>
  );
}

/** 소중한 사람(이름·관계, 여러 명, 선택 입력) */
export function PeopleStep({ scaffold, initial, pending, onSubmit }: StepProps<Person[]>) {
  const t = ko.quiz.questions.people;
  const [people, setPeople] = useState<Person[]>(initial ?? []);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Person['relation']>('partner');
  const canAdd = name.trim().length > 0 && people.length < PEOPLE_MAX;

  const add = () => {
    if (!canAdd) return;
    setPeople((prev) => [...prev, { name: name.trim(), relation }]);
    setName('');
  };

  return (
    <QuizScaffold
      {...scaffold}
      footer={
        people.length > 0 ? (
          <PrimaryButton
            label={ko.common.next}
            loading={pending}
            onPress={() => onSubmit(people)}
          />
        ) : (
          <PrimaryButton
            variant="ghost"
            label={ko.quiz.skip}
            loading={pending}
            onPress={() => onSubmit([])}
          />
        )
      }
    >
      {people.length > 0 && (
        <View className="gap-2">
          {people.map((p, i) => (
            <View
              key={`${p.name}-${i}`}
              className="min-h-[48px] flex-row items-center justify-between rounded-field bg-surface px-4"
            >
              <Text className="text-[16px] text-plum-deep">
                {p.name} · {t.relations[p.relation]}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.remove(p.name)}
                hitSlop={8}
                onPress={() => setPeople((prev) => prev.filter((_, j) => j !== i))}
              >
                <SymbolView
                  name={{ ios: 'xmark', android: 'close' }}
                  size={18}
                  tintColor={tokens.colors['ink-muted']}
                />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {people.length < PEOPLE_MAX && (
        <View className="gap-3">
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={20}
            placeholder={t.namePlaceholder}
            placeholderTextColor={tokens.colors['ink-muted']}
            accessibilityLabel={t.namePlaceholder}
            onSubmitEditing={add}
            className={inputClass}
          />
          <View className="flex-row flex-wrap gap-2">
            {PERSON_RELATION.map((r) => (
              <Pressable
                key={r}
                accessibilityRole="radio"
                accessibilityState={{ selected: relation === r }}
                accessibilityLabel={t.relations[r]}
                onPress={() => setRelation(r)}
                className={`rounded-full border px-4 py-2 ${
                  relation === r ? 'border-plum bg-plum' : 'border-rose bg-surface'
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
          <PrimaryButton variant="ghost" label={t.add} onPress={add} />
        </View>
      )}
    </QuizScaffold>
  );
}

/** 알림 허용(PRD 5절 12번: 시스템 권한 프롬프트 전에 이유를 설명한다) */
export function NotificationStep({ scaffold, pending, onSubmit }: StepProps<{ granted: boolean }>) {
  const [asking, setAsking] = useState(false);

  const allow = async () => {
    setAsking(true);
    try {
      const { granted } = await Notifications.requestPermissionsAsync();
      onSubmit({ granted });
    } finally {
      setAsking(false);
    }
  };

  return (
    <QuizScaffold
      {...scaffold}
      footer={
        <>
          <PrimaryButton
            label={ko.quiz.questions.notification.allow}
            loading={asking || pending}
            onPress={allow}
          />
          <PrimaryButton
            variant="ghost"
            label={ko.common.later}
            onPress={() => onSubmit({ granted: false })}
          />
        </>
      }
    >
      <View />
    </QuizScaffold>
  );
}
