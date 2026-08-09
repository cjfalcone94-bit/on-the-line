jest.mock('@/lib/analytics', () => ({ track: jest.fn(() => false) }));

import { findTemplate, groupTemplates, templates } from '@/lib/catalog/templates';
import { fireEvent, render } from '@testing-library/react-native';
import { TemplateCard } from '@/screens/CatalogScreen';

describe('curated template catalog', () => {
  it('ships 20 templates grouped into the four intended categories', () => {
    expect(templates).toHaveLength(20);
    expect(groupTemplates(templates).map((section) => section.title)).toEqual([
      'Move',
      'Build',
      'Reset',
      'Learn',
    ]);
  });

  it('gives every template a fixed, visible checklist', () => {
    for (const template of templates) {
      expect(template.criteria).toHaveLength(3);
      expect(template.criteria.every((criterion) => criterion.length > 0)).toBe(true);
    }
  });

  it('resolves a catalog item to the same exact detail criteria', () => {
    const catalogItem = templates[0];
    expect(findTemplate(catalogItem.id)?.criteria).toEqual(catalogItem.criteria);
  });

  it('summarizes pass criteria on the browsable card, keeps them accessible, and opens detail', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId, queryByText } = render(<TemplateCard template={templates[0]} onPress={onPress} />);
    expect(getByText('WHAT COUNTS')).toBeTruthy();
    // Collapsed to a count on the card — the full list belongs to the detail screen…
    expect(getByText('3 criteria ›')).toBeTruthy();
    expect(queryByText('— One outdoor walk of at least 20 minutes')).toBeNull();
    // …but screen-reader users still hear every criterion from the card itself.
    expect(getByTestId('template-daily-walk').props.accessibilityLabel).toContain('One outdoor walk of at least 20 minutes');
    fireEvent.press(getByTestId('template-daily-walk'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
