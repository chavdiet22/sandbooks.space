/**
 * Test factories for Tag-related types.
 */
import { faker } from '@faker-js/faker';
import type { Tag, TagColor, TagWithCount } from '../../types/tags.types';

const TAG_COLORS: TagColor[] = [
  'gray', 'red', 'orange', 'amber', 'yellow', 'green',
  'emerald', 'blue', 'indigo', 'purple', 'pink', 'rose',
];

/**
 * Creates a mock Tag with sensible defaults.
 */
export const createTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: overrides.id ?? faker.string.nanoid(),
  name: overrides.name ?? faker.lorem.word(),
  color: overrides.color ?? faker.helpers.arrayElement(TAG_COLORS),
  createdAt: overrides.createdAt ?? Date.now(),
  updatedAt: overrides.updatedAt ?? Date.now(),
  ...overrides,
});

/**
 * Creates a TagWithCount for testing tag lists.
 */
export const createTagWithCount = (
  noteCount = 1,
  overrides: Partial<Tag> = {}
): TagWithCount => ({
  ...createTag(overrides),
  noteCount,
});

/**
 * Creates multiple tags for list testing.
 */
export const createTags = (count: number): Tag[] =>
  Array.from({ length: count }, (_, i) =>
    createTag({ name: `tag-${i + 1}` })
  );

/**
 * Creates a specific tag color.
 */
export const createTagWithColor = (color: TagColor, name?: string): Tag =>
  createTag({ color, name: name ?? color });
