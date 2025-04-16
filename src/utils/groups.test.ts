import type {
  CompareOptions,
  ExtraOptions,
  GroupOptions,
  SortingNode
} from '../types';
import type * as compare from './compare';

import * as general from './general';
import { getGroupNumber, sortNodesByGroups, useGroups } from './groups';

const sortNodes = vi.hoisted(vi.fn<typeof compare.sortNodes>);
vi.mock('./compare', () => ({ sortNodes }));

const matches = vi.hoisted(vi.fn<typeof general.matches>);
vi.mock('./general', () => ({ matches }));

describe('useGroups', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with undefined group', () => {
    expect(
      useGroups({ groups: [['a'], ['b']], matcher: 'regex' }).getGroup()
    ).toBe('unknown');
  });

  it('should define a group', () => {
    const groupManager = useGroups({ groups: [['a'], ['b']], matcher: 'regex' });

    groupManager.defineGroup('a');
    expect(groupManager.getGroup()).toBe('a');
  });

  it('should not define a group not in the groups set', () => {
    const groupManager = useGroups({ groups: [['a'], ['b']], matcher: 'regex' });

    groupManager.defineGroup('c');
    expect(groupManager.getGroup()).toBe('unknown');
  });

  it('should not override existing group by default', () => {
    const groupManager = useGroups({ groups: [['a'], ['b']], matcher: 'regex' });

    groupManager.defineGroup('a');
    groupManager.defineGroup('b');
    expect(groupManager.getGroup()).toBe('a');
  });

  it('should override existing group when override is true', () => {
    const groupManager = useGroups({ groups: [['a'], ['b']], matcher: 'regex' });

    groupManager.defineGroup('a');
    groupManager.defineGroup('b', true);
    expect(groupManager.getGroup()).toBe('b');
  });

  describe('setCustomGroups', () => {
    it('should set group based on string pattern match', () => {
      const groupManager = useGroups({ groups: [['custom'], ['other']], matcher: 'regex' });
      const customGroups = { custom: 'test.*' };
      matches.mockReturnValue(true);

      groupManager.setCustomGroups(customGroups, 'test123');

      expect(matches).toHaveBeenCalledWith('test123', 'test.*', 'regex');
      expect(groupManager.getGroup()).toBe('custom');
    });

    it('should set group based on array pattern match', () => {
      const groupManager = useGroups({ groups: [['custom'], ['other']], matcher: 'regex' });
      const customGroups = { custom: ['test.*', 'demo.*'] };
      matches.mockReturnValueOnce(false).mockReturnValue(true);

      groupManager.setCustomGroups(customGroups, 'demo123');

      expect(matches).toHaveBeenCalledWith('demo123', 'test.*', 'regex');
      expect(matches).toHaveBeenCalledWith('demo123', 'demo.*', 'regex');
      expect(groupManager.getGroup()).toBe('custom');
    });

    it('should respect override parameter', () => {
      const groupManager = useGroups({ groups: [['custom1'], ['custom2']], matcher: 'regex' });
      const customGroups = {
        custom1: 'pattern1',
        custom2: 'pattern2'
      };
      matches.mockReturnValue(true);

      // First set custom1
      groupManager.setCustomGroups(customGroups, 'test123');
      expect(groupManager.getGroup()).toBe('custom1');

      // Then try to set custom2 without override
      groupManager.setCustomGroups({ custom2: 'pattern2' }, 'test123');
      expect(groupManager.getGroup()).toBe('custom1');

      // Then try to set custom2 with override
      groupManager.setCustomGroups({ custom2: 'pattern2' }, 'test123', { override: true });
      expect(groupManager.getGroup()).toBe('custom2');
    });

    it('should handle undefined customGroups', () => {
      const groupManager = useGroups({ groups: [['custom']], matcher: 'regex' });

      groupManager.setCustomGroups(undefined, 'test123');

      expect(groupManager.getGroup()).toBe('unknown');
      expect(general.matches).not.toHaveBeenCalled();
    });
  });
});

describe('getGroupNumber', () => {
  it('should return correct group number for exact match', () => {
    const groups = ['first', 'second', ['third', 'fourth']];
    const node = { group: 'second' } as SortingNode;

    expect(getGroupNumber(groups, node)).toBe(1);
  });

  it('should return correct group number for array group', () => {
    const groups = ['first', 'second', ['third', 'fourth']];
    const node = { group: 'third' } as SortingNode;

    expect(getGroupNumber(groups, node)).toBe(2);
  });

  it('should return groups length for unknown group', () => {
    const groups = ['first', 'second', ['third', 'fourth']];
    const node = { group: 'unknown' } as SortingNode;

    expect(getGroupNumber(groups, node)).toBe(3);
  });

  it('should handle non-string group values in node', () => {
    const groups = ['first', 'second', ['third', 'fourth']];
    const node = { group: 42 } as unknown as SortingNode;

    expect(getGroupNumber(groups, node)).toBe(3);
  });

  it('should handle empty groups array', () => {
    const groups: (string | string[])[] = [];
    const node = { group: 'any' } as SortingNode;

    expect(getGroupNumber(groups, node)).toBe(0);
  });
});

describe('sortNodesByGroups', () => {
  let mockNodes: SortingNode[];
  let options: CompareOptions & GroupOptions;

  beforeEach(() => {
    vi.resetAllMocks();

    mockNodes = [
      { group: 'third', name: 'z', node: {} as any } as SortingNode,
      { group: 'first', name: 'b', node: {} as any } as SortingNode,
      { group: 'first', name: 'a', node: {} as any } as SortingNode,
      { group: 'second', name: 'c', node: {} as any } as SortingNode
    ];

    options = {
      groups: ['first', 'second', 'third'],
      ignoreCase: false,
      order: 'asc',
      specialCharacters: 'keep',
      type: 'alphabetical'
    };

    sortNodes.mockImplementation((nodes) => [...nodes]);
  });

  it('should sort nodes by group number', () => {
    sortNodes.mockImplementation((nodes) => {
      if (nodes[0]?.group === 'first') {
        return nodes.sort((a, b) => a.name.localeCompare(b.name));
      }
      return nodes;
    });

    const result = sortNodesByGroups(mockNodes, options);

    expect(sortNodes).toHaveBeenCalledTimes(3);

    // Nodes should be sorted by group first
    expect(result[0].group).toBe('first');
    expect(result[1].group).toBe('first');
    expect(result[2].group).toBe('second');
    expect(result[3].group).toBe('third');

    // Nodes within 'first' group should be sorted alphabetically
    expect(result[0].name).toBe('a');
    expect(result[1].name).toBe('b');
  });

  it('should handle ignored nodes', () => {
    const extraOptions: ExtraOptions<SortingNode> = {
      isNodeIgnored: (node) => node.name === 'a'
    };

    const result = sortNodesByGroups(mockNodes, options, extraOptions);

    expect(result.length).toBe(4);
    // The ignored node 'a' should remain at index 2
    expect(result[2].name).toBe('a');
  });

  it('should use custom compare options for specific groups', () => {
    const customOptions: CompareOptions = {
      ignoreCase: true,
      order: 'desc',
      specialCharacters: 'remove',
      type: 'natural'
    };

    const extraOptions: ExtraOptions<SortingNode> = {
      getGroupCompareOptions: (groupNum) => (groupNum === 0 ? customOptions : options)
    };

    sortNodesByGroups(mockNodes, options, extraOptions);

    // First call should use customOptions for group 0 ('first')
    expect(sortNodes).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({ group: 'first', name: 'b' }),
        expect.objectContaining({ group: 'first', name: 'a' })
      ]),
      customOptions
    );

    expect(sortNodes).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([expect.objectContaining({ group: 'second' })]),
      options
    );
  });

  it('should handle null compare options from getGroupCompareOptions', () => {
    expect(sortNodesByGroups(mockNodes, options, {
      getGroupCompareOptions: (groupNum) => (groupNum === 1 ? null : options)
    }).length).toBe(4);
    expect(sortNodes).toHaveBeenCalledTimes(2);
  });

  it('should handle empty nodes array', () => {
    expect(sortNodesByGroups([], options)).toEqual([]);
    expect(sortNodes).not.toHaveBeenCalled();
  });
});
