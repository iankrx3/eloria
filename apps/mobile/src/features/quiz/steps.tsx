import { AGE_MAX, AGE_MIN, PEOPLE_MAX, type Person } from '@eloria/shared';
import { useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { Logo } from '@/components/logo';
import { PrimaryButton } from '@/components/primary-button';
import { ko } from '@/i18n/ko';
import { photoTextSoft } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import { GlassInput, GridCell, OptionCard } from './option-card';
import { QuizScaffold } from './quiz-scaffold';
import { guessRelation } from './relation';

type Scaffold = Omit<ComponentProps<typeof QuizScaffold>, 'children'>;
type Option<K extends string> = { key: K; label: string };

type StepProps<T> = {
  scaffold: Scaffold;
  initial?: T;
  pending: boolean;
  onSubmit: (answer: T) => void;
};

/** 단일 선택 탭 뒤 고른 보기를 잠깐 보여 주고 넘어가는 시간(Figma 노트: 0.2초) */
const ADVANCE_DELAY_MS = 200;

function Continue({
  enabled,
  pending,
  onPress,
}: {
  enabled: boolean;
  pending: boolean;
  onPress: () => void;
}) {
  return (
    <PrimaryButton
      variant="pearl"
      label={ko.common.continue}
      disabled={!enabled}
      loading={pending}
      onPress={onPress}
    />
  );
}

/** 이름·자유 서술 */
export function TextStep({
  scaffold,
  initial,
  pending,
  onSubmit,
  maxLength,
  placeholder,
  multiline = false,
  privacyNote = false,
}: StepProps<string> & {
  maxLength: number;
  placeholder: string;
  multiline?: boolean;
  privacyNote?: boolean;
}) {
  const [value, setValue] = useState(initial ?? '');
  const trimmed = value.trim();
  const submit = () => trimmed && onSubmit(trimmed);

  return (
    <QuizScaffold
      {...scaffold}
      brand={
        privacyNote ? (
          <View className="pb-7">
            <Logo size={48} tone="photo" showTagline />
          </View>
        ) : undefined
      }
    >
      <GlassInput
        value={value}
        onChangeText={setValue}
        maxLength={maxLength}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        multiline={multiline}
        returnKeyType={multiline ? 'default' : 'next'}
        onSubmitEditing={() => !multiline && submit()}
      />
      {privacyNote && (
        <Text className={`${type.caption} text-center text-on-photo/90`} style={photoTextSoft}>
          {ko.quiz.privacy}
        </Text>
      )}
      <Continue enabled={trimmed.length > 0} pending={pending} onPress={submit} />
    </QuizScaffold>
  );
}

/** 나이(숫자 키패드). 만 14세 미만은 안내만 하고 넘어가지 않는다. */
export function NumberStep({ scaffold, initial, pending, onSubmit }: StepProps<number>) {
  const [value, setValue] = useState(initial ? String(initial) : '');
  const n = Number(value);
  const valid = value.length > 0 && Number.isInteger(n) && n >= AGE_MIN && n <= AGE_MAX;
  const underAge = value.length > 0 && Number.isInteger(n) && n > 0 && n < AGE_MIN;

  return (
    <QuizScaffold {...scaffold} error={underAge ? ko.quiz.questions.age.underAge : scaffold.error}>
      <GlassInput
        value={value}
        onChangeText={(t) => setValue(t.replace(/[^0-9]/g, ''))}
        maxLength={2}
        keyboardType="number-pad"
        placeholder={ko.quiz.questions.age.placeholder}
        accessibilityLabel={ko.quiz.questions.age.placeholder}
      />
      <Continue enabled={valid} pending={pending} onPress={() => valid && onSubmit(n)} />
    </QuizScaffold>
  );
}

/** 단일 선택: 누르면 고른 보기가 흰 배경으로 바뀌고 잠시 뒤 저장·다음으로 간다. */
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
      {options.map((o) => (
        <OptionCard
          key={o.key}
          label={o.label}
          selected={picked === o.key}
          disabled={pending}
          onPress={() => {
            setPicked(o.key);
            setTimeout(() => onSubmit(o.key), ADVANCE_DELAY_MS);
          }}
        />
      ))}
    </QuizScaffold>
  );
}

/** 복수 선택 그리드(최대 개수). 마지막 보기가 홀수로 남으면 한 줄 전체를 쓴다. */
export function GridStep<K extends string>({
  scaffold,
  initial,
  pending,
  onSubmit,
  options,
  max,
}: StepProps<K[]> & { options: Option<K>[]; max: number }) {
  const [picked, setPicked] = useState<K[]>(initial ?? []);
  const toggle = (key: K) =>
    setPicked((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length < max
          ? [...prev, key]
          : prev,
    );

  return (
    <QuizScaffold {...scaffold}>
      <Text className={`${type.caption} text-center text-on-photo/90`} style={photoTextSoft}>
        {ko.quiz.multiMax(max)}
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {options.map((o, i) => (
          <GridCell
            key={o.key}
            label={o.label}
            selected={picked.includes(o.key)}
            onPress={() => toggle(o.key)}
            full={options.length % 2 === 1 && i === options.length - 1}
          />
        ))}
      </View>
      <Continue enabled={picked.length > 0} pending={pending} onPress={() => onSubmit(picked)} />
    </QuizScaffold>
  );
}

/** 건너뛸 수 있는 자유 서술(바라는 사랑). 건너뛰면 null을 저장한다. */
export function SkippableTextStep({
  scaffold,
  initial,
  pending,
  onSubmit,
  maxLength,
  placeholder,
  skipLabel,
}: StepProps<string | null> & { maxLength: number; placeholder: string; skipLabel: string }) {
  const [value, setValue] = useState(initial ?? '');
  const trimmed = value.trim();

  return (
    <QuizScaffold {...scaffold}>
      <GlassInput
        value={value}
        onChangeText={setValue}
        maxLength={maxLength}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        multiline
      />
      <Continue
        enabled={trimmed.length > 0}
        pending={pending}
        onPress={() => trimmed && onSubmit(trimmed)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={skipLabel}
        disabled={pending}
        onPress={() => onSubmit(null)}
        className="items-center py-1"
      >
        <Text className={`${type.body} text-on-photo/90`} style={photoTextSoft}>
          {skipLabel}
        </Text>
      </Pressable>
    </QuizScaffold>
  );
}

/** 소중한 사람 칩(엔터 = 추가, × = 삭제). 0명이면 넘어가지 않는다. 관계는 마이페이지에서 고칠 수 있다. */
export function PeopleStep({ scaffold, initial, pending, onSubmit }: StepProps<Person[]>) {
  const t = ko.quiz.questions.people;
  const [people, setPeople] = useState<Person[]>(initial ?? []);
  const [name, setName] = useState('');
  const canAdd = name.trim().length > 0 && people.length < PEOPLE_MAX;

  const add = () => {
    if (!canAdd) return;
    setPeople((prev) => [...prev, { name: name.trim(), relation: guessRelation(name.trim()) }]);
    setName('');
  };

  return (
    <QuizScaffold {...scaffold}>
      {people.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {people.map((p, i) => (
            <View
              key={`${p.name}-${i}`}
              className="flex-row items-center gap-2 rounded-full border border-on-photo/70 bg-on-photo/60 py-[10px] pl-4 pr-3"
            >
              <Icon name="heartSmall" size={16} color={tokens.colors.plum} />
              <Text className={`${type.body} text-plum-deep`}>{p.name}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.remove(p.name)}
                hitSlop={10}
                onPress={() => setPeople((prev) => prev.filter((_, j) => j !== i))}
              >
                <Icon name="remove" size={14} color={tokens.colors['plum-deep']} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {people.length < PEOPLE_MAX && (
        <GlassInput
          value={name}
          onChangeText={setName}
          maxLength={20}
          placeholder={t.placeholder}
          accessibilityLabel={t.placeholder}
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={add}
        />
      )}
      <Continue
        enabled={people.length > 0 || canAdd}
        pending={pending}
        onPress={() => {
          // 입력만 하고 엔터를 누르지 않았으면 그 이름까지 담는다.
          const all = canAdd
            ? [...people, { name: name.trim(), relation: guessRelation(name.trim()) }]
            : people;
          if (all.length > 0) onSubmit(all);
        }}
      />
    </QuizScaffold>
  );
}
