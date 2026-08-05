import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenScaffold } from '@/components/ScreenScaffold';

const NOTCHED_METRICS = {
  frame: { height: 852, width: 393, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 59 },
};

function renderScaffold() {
  return render(
    <SafeAreaProvider initialMetrics={NOTCHED_METRICS}>
      <ScreenScaffold
        footer={<Text>Footer action</Text>}
        header={<Text>Header</Text>}
        testID="scaffold-under-test"
      >
        <Text>Body content</Text>
      </ScreenScaffold>
    </SafeAreaProvider>,
  );
}

describe('ScreenScaffold safe-area contract (build 21 notch regression)', () => {
  it('pads the shell by the real top inset so content never renders under the notch', () => {
    const { getByTestId } = renderScaffold();
    const shell = getByTestId('scaffold-under-test');
    const flattened = Object.assign({}, ...[shell.props.style].flat(Infinity));
    expect(flattened.paddingTop).toBe(59);
  });

  it('pads the shell by the real bottom inset so the pinned footer clears the home indicator', () => {
    const { getByTestId } = renderScaffold();
    const shell = getByTestId('scaffold-under-test');
    const flattened = Object.assign({}, ...[shell.props.style].flat(Infinity));
    expect(flattened.paddingBottom).toBe(34);
    expect(getByTestId('screen-scaffold-footer')).toBeTruthy();
  });

  it('keeps header, scrolling body, and footer all mounted', () => {
    const { getByText } = renderScaffold();
    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Body content')).toBeTruthy();
    expect(getByText('Footer action')).toBeTruthy();
  });
});
