jest.mock('react-native-reanimated', () => {
  const native = require('react-native');
  return ({
  __esModule: true,
  default: {
    createAnimatedComponent: (component: unknown) => component,
    View: native.Animated.View,
  },
  Easing: { bezier: () => (value: number) => value },
  useAnimatedStyle: (factory: () => object) => factory(),
  useSharedValue: (initial: number) => ({ value: initial }),
  withSpring: jest.fn((value: number) => value),
  withTiming: jest.fn((value: number) => value),
  });
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
