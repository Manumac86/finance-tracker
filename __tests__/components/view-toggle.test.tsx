import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle, ViewModeIndicator } from '@/components/ui/view-toggle';

describe('ViewToggle', () => {
  it('renders individual and family options', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <ViewToggle
        currentView="individual"
        onViewChange={mockOnViewChange}
        showFamilyOption={true}
      />
    );

    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
  });

  it('calls onViewChange when clicking family button', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <ViewToggle
        currentView="individual"
        onViewChange={mockOnViewChange}
        showFamilyOption={true}
      />
    );

    fireEvent.click(screen.getByText('Family'));
    expect(mockOnViewChange).toHaveBeenCalledWith('family');
  });

  it('does not render when showFamilyOption is false', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <ViewToggle
        currentView="individual"
        onViewChange={mockOnViewChange}
        showFamilyOption={false}
      />
    );

    expect(screen.queryByText('Individual')).not.toBeInTheDocument();
    expect(screen.queryByText('Family')).not.toBeInTheDocument();
  });

  it('highlights current view', () => {
    const mockOnViewChange = jest.fn();
    
    render(
      <ViewToggle
        currentView="family"
        onViewChange={mockOnViewChange}
        showFamilyOption={true}
      />
    );

    const familyButton = screen.getByText('Family');
    const individualButton = screen.getByText('Individual');
    
    // Family button should be the primary button (active)
    expect(familyButton.closest('button')).toHaveClass('bg-primary');
    // Individual button should be a ghost button (inactive)
    expect(individualButton.closest('button')).not.toHaveClass('bg-primary');
  });
});

describe('ViewModeIndicator', () => {
  it('shows individual view indicator', () => {
    render(
      <ViewModeIndicator
        currentView="individual"
      />
    );

    expect(screen.getByText('Viewing: Individual data')).toBeInTheDocument();
  });

  it('shows family view indicator with family name', () => {
    render(
      <ViewModeIndicator
        currentView="family"
        familyName="Smith Family"
      />
    );

    expect(screen.getByText('Viewing: Smith Family data')).toBeInTheDocument();
  });

  it('shows default family view indicator without family name', () => {
    render(
      <ViewModeIndicator
        currentView="family"
      />
    );

    expect(screen.getByText('Viewing: Family data')).toBeInTheDocument();
  });
});