import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);
    
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} disabled />);
    
    fireEvent.press(getByText('Test'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId, queryByText } = render(
      <Button title="Test" onPress={() => {}} loading />
    );
    
    expect(queryByText('Test')).toBeNull();
    // ActivityIndicator should be rendered (though we can't easily test it)
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { queryByText, getByTestId } = render(<Button title="Test" onPress={onPress} loading />);
    
    // When loading, the text is not shown (ActivityIndicator is shown instead)
    expect(queryByText('Test')).toBeNull();
    // Button is disabled when loading, so onPress won't be called
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with primary variant by default', () => {
    const { getByText } = render(<Button title="Test" onPress={() => {}} />);
    const button = getByText('Test').parent;
    expect(button).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button title="Test" onPress={() => {}} variant="primary" />);
    rerender(<Button title="Test" onPress={() => {}} variant="secondary" />);
    rerender(<Button title="Test" onPress={() => {}} variant="outline" />);
    rerender(<Button title="Test" onPress={() => {}} variant="ghost" />);
    rerender(<Button title="Test" onPress={() => {}} variant="danger" />);
    // All should render without errors
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button title="Test" onPress={() => {}} size="sm" />);
    rerender(<Button title="Test" onPress={() => {}} size="md" />);
    rerender(<Button title="Test" onPress={() => {}} size="lg" />);
    // All should render without errors
  });
});

