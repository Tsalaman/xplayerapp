import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import Card from '../Card';

describe('Card', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('renders with default variant', () => {
    const { getByText } = render(
      <Card>
        <Text>Test</Text>
      </Card>
    );
    expect(getByText('Test')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender, getByText } = render(
      <Card variant="default">
        <Text>Test</Text>
      </Card>
    );
    expect(getByText('Test')).toBeTruthy();

    rerender(
      <Card variant="elevated">
        <Text>Test</Text>
      </Card>
    );
    expect(getByText('Test')).toBeTruthy();

    rerender(
      <Card variant="outlined">
        <Text>Test</Text>
      </Card>
    );
    expect(getByText('Test')).toBeTruthy();
  });

  it('renders with different padding sizes', () => {
    const { rerender, getByText } = render(
      <Card padding="none">
        <Text>Test</Text>
      </Card>
    );
    expect(getByText('Test')).toBeTruthy();

    rerender(
      <Card padding="sm">
        <Text>Test</Text>
      </Card>
    );
    expect(getByText('Test')).toBeTruthy();

    rerender(
      <Card padding="md">
        <Text>Test</Text>
      </Card>
    );
    expect(getByText('Test')).toBeTruthy();

    rerender(
      <Card padding="lg">
        <Text>Test</Text>
      </Card>
    );
    expect(getByText('Test')).toBeTruthy();
  });
});

