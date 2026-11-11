import {
  addPersonalItem,
  AGE_MAX,
  AGE_MIN,
  GENDER,
  NAME_MAX,
  PEOPLE_MAX,
  PERSONAL_ITEM_MAX,
  PERSONAL_LIST_MAX,
  type Person,
} from '@eloria/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { PrimaryButton } from '@/components/primary-button';
import { AddChip, AddRow, ListGroup, ListRow, RemovableChip, SectionLabel } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { DevStatus } from '@/features/dev/dev-status';
import { useFavorites, useMyStories } from '@/features/library/use-library';
import { useBottomSpace } from '@/features/navigation/tab-bar';
import { ChoiceChips, EditSheet, FieldLabel, SheetInput } from '@/features/profile/edit-sheet';
import { useAddPerson, usePeople, useRemovePerson } from '@/features/profile/use-people';
import {
  useProfile,
  useSetOnboardingCompleted,
  useUpdatePersonal,
} from '@/features/profile/use-profile';
import { useQuizAnswers, useSaveQuizAnswer } from '@/features/quiz/use-quiz';
import { ko } from '@/i18n/ko';
import {
  avatarGradient,
  dawnScreenLong,
  membershipCard,
  personGradients,
  shadow,
} from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type Sheet = 'name' | 'age' | 'gender' | 'person' | 'pet' | 'lifestyle' | 'exclude' | null;

const PERSON_RELATIONS = [
  'partner',
  'family',
  'friend',
  'other',
] as const satisfies readonly Person['relation'][];

/**
 * 마이페이지(Figma P01, PRD F-11 Personal). 여기 적은 이름·사람·라이프스타일·뺄 것은 다음 이야기부터 반영된다.
 * 나이·성별은 퀴즈 답(quiz_answers)으로 저장한다. 설정 화면·구독 관리·사는 곳/하는 일·보관함은 이후 작업(ROADMAP).
 */
export default function Me() {
  const auth = useAuth();
  const profile = useProfile();
  const people = usePeople();
  const stories = useMyStories();
  const favorites = useFavorites();
  const quiz = useQuizAnswers();
  const saveAnswer = useSaveQuizAnswer();
  const update = useUpdatePersonal();
  const addPerson = useAddPerson();
  const removePerson = useRemovePerson();
  const setOnboarding = useSetOnboardingCompleted();
  const bottom = useBottomSpace();

  const [sheet, setSheet] = useState<Sheet>(null);
  const [draft, setDraft] = useState('');
  const [relation, setRelation] = useState<Person['relation']>('family');
  const [gender, setGender] = useState<(typeof GENDER)[number]>();
  const [error, setError] = useState<string>();
  const isAnonymous = auth.status === 'signed-in' && auth.session.user.is_anonymous;

  if (profile.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-pearl">
        <ActivityIndicator color={tokens.colors.plum} />
      </View>
    );
  }

  const p = profile.data;
  const name = p?.displayName ?? '';
  const likes = p?.likes ?? [];
  const dislikes = p?.dislikes ?? [];
  const allPeople = people.data ?? [];
  const humans = allPeople.filter((x) => x.relation !== 'pet');
  const pets = allPeople.filter((x) => x.relation === 'pet');
  const answers = quiz.data ?? {};
  const fullPeople = allPeople.length >= PEOPLE_MAX;

  const open = (s: Exclude<Sheet, null>) => {
    setError(undefined);
    setDraft(s === 'name' ? name : s === 'age' && answers.age ? String(answers.age) : '');
    setRelation('family');
    setGender(answers.gender);
    setSheet(s);
  };
  const close = () => setSheet(null);
  const onError = () => setError(ko.me.saveFailed);
  const done = { onSuccess: close, onError };

  const trimmed = draft.trim();
  const age = Number(draft);
  const canSubmit =
    sheet === 'gender'
      ? Boolean(gender)
      : sheet === 'age'
        ? Number.isInteger(age) && age >= AGE_MIN && age <= AGE_MAX
        : trimmed.length > 0;

  const submit = () => {
    switch (sheet) {
      case 'name':
        return update.mutate({ displayName: trimmed }, done);
      case 'age':
        return saveAnswer.mutate({ questionKey: 'age', answer: age }, done);
      case 'gender':
        return gender && saveAnswer.mutate({ questionKey: 'gender', answer: gender }, done);
      case 'person':
        return addPerson.mutate({ name: trimmed, relation }, done);
      case 'pet':
        return addPerson.mutate({ name: trimmed, relation: 'pet' }, done);
      case 'lifestyle':
        return update.mutate({ likes: addPersonalItem(likes, trimmed) }, done);
      case 'exclude':
        return update.mutate({ dislikes: addPersonalItem(dislikes, trimmed) }, done);
    }
  };

  const s = ko.me.sheet;
  const sheetCopy: Record<
    Exclude<Sheet, null>,
    { title: string; desc?: string; submit: string }
  > = {
    name: { title: s.nameTitle, submit: s.save },
    age: { title: s.ageTitle, submit: s.save },
    gender: { title: s.genderTitle, submit: s.save },
    person: { title: s.personTitle, desc: s.personDesc, submit: s.submit },
    pet: { title: s.petTitle, desc: s.petDesc, submit: s.submit },
    lifestyle: { title: s.lifestyleTitle, submit: s.submit },
    exclude: { title: s.excludeTitle, submit: s.submit },
  };

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom }}
      >
        <DawnBackdrop
          style={dawnScreenLong}
          glows={[
            { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
            { x: -110, y: 460, width: 260, ...GLOW.periwinkleWide },
            { x: 170, y: 980, width: 260, ...GLOW.pinkWide },
            { x: -110, y: 1500, width: 260, ...GLOW.periwinkleWide },
          ]}
        />
        <SafeAreaView edges={['top']} className="px-gutter pt-2">
          {/* 머리: 이니셜 아바타 + 이름 */}
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 min-w-12 items-center justify-center rounded-full border-2 border-on-photo px-[6px]"
              style={avatarGradient}
            >
              <Text className={`${type.h2} text-plum`}>
                {name.slice(0, 1) || ko.brand.name.slice(0, 1)}
              </Text>
            </View>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              className={`${type.h1} flex-1 text-plum-deep`}
            >
              {name}
            </Text>
          </View>
          <Text className={`${type.caption} mt-[10px] text-ink-soft`}>{ko.me.subtitle}</Text>

          {error && (
            <Text accessibilityLiveRegion="polite" className={`${type.caption} mt-2 text-plum`}>
              {error}
            </Text>
          )}

          {/* 멤버십 카드(결제는 M5) */}
          <View
            className="mt-5 gap-[6px] overflow-hidden rounded-[24px] px-5 pb-[18px] pt-5"
            style={membershipCard}
          >
            <Text className={`${type.label} text-on-photo/85`}>{ko.me.membershipLabel}</Text>
            <Text className={`${type.h2} text-on-photo`}>{ko.me.membershipFree}</Text>
            <Text className={`${type.caption} text-on-photo/80`}>{ko.me.membershipFreeBody}</Text>
            <View className="flex-row pt-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={ko.me.membershipCta}
                onPress={() => router.push('/paywall')}
                className="rounded-full bg-on-photo px-4 py-2"
              >
                <Text className={`${type.caption} text-plum`}>{ko.me.membershipCta}</Text>
              </Pressable>
            </View>
            <View className="absolute right-4 top-[14px] opacity-40">
              <Icon name="moonOutline" size={64} color={tokens.colors['on-photo']} />
            </View>
          </View>

          {/* 숫자 */}
          <View className="mt-[14px] flex-row gap-[10px]">
            {[
              { label: ko.me.stats.stories, value: stories.data?.length ?? 0 },
              { label: ko.me.stats.liked, value: favorites.data?.size ?? 0 },
              { label: ko.me.stats.people, value: humans.length },
            ].map((stat) => (
              <View
                key={stat.label}
                accessible
                accessibilityLabel={`${stat.label} ${stat.value}`}
                className="flex-1 items-center gap-[2px] rounded-[20px] border border-glass-border bg-glass py-[14px]"
                style={shadow.glass}
              >
                <Text className={`${type.number} text-plum`}>{stat.value}</Text>
                <Text className={`${type.caption} text-ink-soft`}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="sparkle" label={ko.me.myLibrary} />
            <ListGroup>
              <ListRow label={ko.me.savedStories} onPress={() => router.push('/stories')} last />
            </ListGroup>
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="sparkle" label={ko.me.basics} />
            <ListGroup>
              <ListRow
                label={ko.me.name}
                value={name || ko.me.notSet}
                onPress={() => open('name')}
              />
              <ListRow
                label={ko.me.age}
                value={answers.age ? String(answers.age) : ko.me.notSet}
                onPress={() => open('age')}
              />
              <ListRow
                label={ko.me.gender}
                value={
                  answers.gender ? ko.quiz.questions.gender.options[answers.gender] : ko.me.notSet
                }
                onPress={() => open('gender')}
                last
              />
            </ListGroup>
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="heartSmall" label={ko.me.people} />
            <ListGroup>
              {humans.map((person, i) => (
                <View
                  key={person.id}
                  className="flex-row items-center gap-3 border-b border-hairline px-[18px] py-[14px]"
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={personGradients[i % personGradients.length]}
                  >
                    <Icon name="heartSmall" size={16} color={tokens.colors['on-photo']} />
                  </View>
                  <View className="flex-1 gap-[2px]">
                    <Text className={`${type.bodyMedium} text-plum-deep`}>{person.name}</Text>
                    <Text className={`${type.caption} text-ink-faint`}>
                      {ko.quiz.relations[person.relation]}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={ko.me.remove(person.name)}
                    hitSlop={10}
                    onPress={() => removePerson.mutate(person.id, { onError })}
                  >
                    <Icon name="remove" size={14} color={tokens.colors['ink-soft']} />
                  </Pressable>
                </View>
              ))}
              {!fullPeople && <AddRow label={ko.me.addPerson} onPress={() => open('person')} />}
            </ListGroup>
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="paw" label={ko.me.pets} />
            <ListGroup>
              {pets.length === 0 && (
                <Text className={`${type.caption} pt-[18px] text-center text-ink-faint`}>
                  {ko.me.petsHint}
                </Text>
              )}
              {pets.map((pet) => (
                <View
                  key={pet.id}
                  className="flex-row items-center gap-3 border-b border-hairline px-[18px] py-[14px]"
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={personGradients[2]}
                  >
                    <Icon name="paw" size={16} color={tokens.colors['on-photo']} />
                  </View>
                  <Text className={`${type.bodyMedium} flex-1 text-plum-deep`}>{pet.name}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={ko.me.remove(pet.name)}
                    hitSlop={10}
                    onPress={() => removePerson.mutate(pet.id, { onError })}
                  >
                    <Icon name="remove" size={14} color={tokens.colors['ink-soft']} />
                  </Pressable>
                </View>
              ))}
              {!fullPeople && <AddRow label={ko.me.addPet} onPress={() => open('pet')} />}
            </ListGroup>
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="sparkle" label={ko.me.lifestyle} />
            <View className="flex-row flex-wrap gap-2">
              {likes.map((item) => (
                <RemovableChip
                  key={item}
                  label={item}
                  onRemove={() =>
                    update.mutate({ likes: likes.filter((x) => x !== item) }, { onError })
                  }
                />
              ))}
              {likes.length < PERSONAL_LIST_MAX && (
                <AddChip label={ko.me.add} onPress={() => open('lifestyle')} />
              )}
            </View>
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="removeSmall" label={ko.me.exclude} />
            <View className="flex-row flex-wrap gap-2">
              {dislikes.map((item) => (
                <RemovableChip
                  key={item}
                  label={item}
                  onRemove={() =>
                    update.mutate({ dislikes: dislikes.filter((x) => x !== item) }, { onError })
                  }
                />
              ))}
              {dislikes.length < PERSONAL_LIST_MAX && (
                <AddChip label={ko.me.add} onPress={() => open('exclude')} />
              )}
            </View>
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="archive" label={ko.me.account} />
            <ListGroup>
              <ListRow
                label={isAnonymous ? ko.me.accountAnonymous : ko.me.accountLinked}
                onPress={isAnonymous ? () => router.push('/link-account') : undefined}
                value={isAnonymous ? ko.me.linkAccount : undefined}
                last
              />
            </ListGroup>
          </View>

          {__DEV__ && (
            <View className="mt-7 gap-3">
              <DevStatus />
              <PrimaryButton
                variant="ghost"
                label={ko.me.restartOnboarding}
                loading={setOnboarding.isPending}
                onPress={() =>
                  setOnboarding.mutate(false, { onSuccess: () => router.replace('/') })
                }
              />
            </View>
          )}
        </SafeAreaView>
      </ScrollView>

      {sheet && (
        <EditSheet
          visible
          title={sheetCopy[sheet].title}
          description={sheetCopy[sheet].desc}
          submitLabel={sheetCopy[sheet].submit}
          canSubmit={canSubmit}
          pending={update.isPending || addPerson.isPending || saveAnswer.isPending}
          onSubmit={submit}
          onClose={close}
        >
          {sheet === 'gender' ? (
            <ChoiceChips
              options={GENDER.map((g) => ({ key: g, label: ko.quiz.questions.gender.options[g] }))}
              value={gender}
              onChange={setGender}
            />
          ) : (
            <>
              {(sheet === 'person' || sheet === 'pet') && <FieldLabel>{s.nameLabel}</FieldLabel>}
              <SheetInput
                value={draft}
                onChangeText={(t) => setDraft(sheet === 'age' ? t.replace(/[^0-9]/g, '') : t)}
                autoFocus
                keyboardType={sheet === 'age' ? 'number-pad' : 'default'}
                maxLength={
                  sheet === 'age'
                    ? 2
                    : sheet === 'lifestyle' || sheet === 'exclude'
                      ? PERSONAL_ITEM_MAX
                      : NAME_MAX
                }
                placeholder={
                  sheet === 'person'
                    ? s.namePlaceholder
                    : sheet === 'pet'
                      ? s.petPlaceholder
                      : sheet === 'lifestyle'
                        ? s.lifestylePlaceholder
                        : sheet === 'exclude'
                          ? s.excludePlaceholder
                          : sheetCopy[sheet].title
                }
                accessibilityLabel={sheetCopy[sheet].title}
                onSubmitEditing={() => canSubmit && submit()}
              />
              {sheet === 'person' && (
                <>
                  <FieldLabel>{s.relationLabel}</FieldLabel>
                  <ChoiceChips
                    options={PERSON_RELATIONS.map((r) => ({ key: r, label: ko.quiz.relations[r] }))}
                    value={relation}
                    onChange={setRelation}
                  />
                </>
              )}
            </>
          )}
        </EditSheet>
      )}
    </View>
  );
}
