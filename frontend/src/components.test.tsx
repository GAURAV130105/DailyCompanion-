import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreRing } from './components/shared/ScoreRing';
import { EmptyState } from './components/shared/EmptyState';

describe('Shared UI Components', () => {
  it('renders ScoreRing with correct numeric score', () => {
    render(<ScoreRing score={8.5} maxScore={10} />);
    expect(screen.getByText('8.5')).toBeDefined();
    expect(screen.getByText('out of 10')).toBeDefined();
  });

  it('renders EmptyState with title and description', () => {
    render(
      <EmptyState
        title="No items found"
        description="Try adding a new item to get started."
      />
    );
    expect(screen.getByText('No items found')).toBeDefined();
    expect(screen.getByText('Try adding a new item to get started.')).toBeDefined();
  });
});
