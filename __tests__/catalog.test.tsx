jest.mock('@/lib/analytics', () => ({ track: jest.fn(() => false) }));

import { findTemplate, groupTemplates, templates } from '@/lib/catalog/templates';
import { fireEvent, render } from '@testing-library/react-native';
import { TemplateRow } from '@/screens/CatalogScreen';

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

  it('shows terms and a proof line, keeps criteria accessible, and opens detail', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId, queryByText } = render(<TemplateRow first template={templates[0]} onPress={onPress} />);
    // The row carries the two things needed to COMPARE goals: the terms…
    expect(getByText(templates[0].cadence)).toBeTruthy();
    // …and one proof line, which is also the stake signal ("you will be checked").
    // Nested <Text> composes into one string node, so match the composed line.
    expect(getByText(`Proof: ${templates[0].proof}`)).toBeTruthy();
    // The catalogue must NOT carry the full criteria or the restating summary —
    // those answer "what am I signing?", which belongs at the point of signature.
    expect(queryByText('WHAT COUNTS')).toBeNull();
    expect(queryByText(templates[0].summary)).toBeNull();
    expect(queryByText('One outdoor walk of at least 20 minutes')).toBeNull();
    // Screen-reader users still hear every criterion from the row itself, so the
    // density win costs them nothing.
    expect(getByTestId('template-daily-walk').props.accessibilityLabel).toContain('One outdoor walk of at least 20 minutes');
    fireEvent.press(getByTestId('template-daily-walk'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('gives every template a proof line that is not just the summary', () => {
    // The proof line is a truthful compression of the template's own criteria.
    // If it ever drifts into marketing copy, this catches it.
    for (const template of templates) {
      expect(template.proof.length).toBeGreaterThan(8);
      expect(template.proof).not.toBe(template.summary);
      expect(template.proof).toContain('·');
    }
  });
});
