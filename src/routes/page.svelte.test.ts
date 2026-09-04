import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Page from './+page.svelte';

describe('página inicial', () => {
  it('renderiza o título do template', () => {
    render(Page);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('template SvelteKit');
  });
});
