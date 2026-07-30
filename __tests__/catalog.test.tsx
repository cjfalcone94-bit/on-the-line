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

  it('renders the pass criteria on the browsable card and opens detail', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(<TemplateCard template={templates[0]} onPress={onPress} />);
    expect(getByText('WHAT COUNTS')).toBeTruthy();
    expect(getByText('— One outdoor walk of at least 20 minutes')).toBeTruthy();
    fireEvent.press(getByTestId('template-daily-walk'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
