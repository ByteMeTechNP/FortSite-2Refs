import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

describe('form and status feedback', () => {
  it('associates a label with an invalid field and text error', () => {
    render(
      <div>
        <Label htmlFor="sample-field">Sample field</Label>
        <Input
          id="sample-field"
          aria-invalid="true"
          aria-describedby="sample-field-error"
        />
        <p id="sample-field-error">Enter a complete value.</p>
      </div>,
    );

    const field = screen.getByLabelText('Sample field');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Enter a complete value.');
  });

  it('exposes badge and alert text', () => {
    render(
      <>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Alert variant="danger">
          <AlertTitle>Danger</AlertTitle>
          <AlertDescription>Readable danger message.</AlertDescription>
        </Alert>
      </>,
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Danger');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Readable danger message.',
    );
  });
});
