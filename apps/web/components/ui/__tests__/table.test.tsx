import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../table';

describe('Table', () => {
  it('renders with default props', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Table content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
  });

  it('applies custom className', () => {
    render(
      <Table className='custom-table'>
        <TableBody>
          <TableRow>
            <TableCell>Table content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const table = screen.getByRole('table');
    expect(table).toHaveClass('custom-table');
  });

  it('forwards additional props', () => {
    render(
      <Table data-testid='table-test'>
        <TableBody>
          <TableRow>
            <TableCell>Table content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const table = screen.getByTestId('table-test');
    expect(table).toBeInTheDocument();
  });

  it('wraps table in scrollable container', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Table content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const container = screen.getByRole('table').parentElement;
    expect(container).toHaveClass('relative', 'w-full', 'overflow-auto');
  });
});

describe('TableHeader', () => {
  it('renders with default props', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    const thead = screen.getByRole('rowgroup');
    expect(thead).toHaveClass('[&_tr]:border-b');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableHeader className='custom-header'>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    const thead = screen.getByRole('rowgroup');
    expect(thead).toHaveClass('custom-header');
  });
});

describe('TableBody', () => {
  it('renders with default props', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Body</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const tbody = screen.getAllByRole('rowgroup')[0]; // First rowgroup (tbody)
    expect(tbody).toHaveClass('[&_tr:last-child]:border-0');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableBody className='custom-body'>
          <TableRow>
            <TableCell>Body</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const tbody = screen.getAllByRole('rowgroup')[0];
    expect(tbody).toHaveClass('custom-body');
  });
});

describe('TableFooter', () => {
  it('renders with default props', () => {
    render(
      <Table>
        <TableFooter>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    const tfoot = screen.getAllByRole('rowgroup')[0]; // Footer rowgroup
    expect(tfoot).toHaveClass('border-t', 'bg-muted/50', 'font-medium', '[&>tr]:last:border-b-0');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableFooter className='custom-footer'>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    const tfoot = screen.getAllByRole('rowgroup')[0];
    expect(tfoot).toHaveClass('custom-footer');
  });
});

describe('TableRow', () => {
  it('renders with default props', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByRole('row');
    expect(row).toHaveClass(
      'border-b',
      'transition-colors',
      'hover:bg-muted/50',
      'data-[state=selected]:bg-muted'
    );
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow className='custom-row'>
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByRole('row');
    expect(row).toHaveClass('custom-row');
  });

  it('handles selected state', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-state='selected'>
            <TableCell>Selected Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByRole('row');
    expect(row).toHaveAttribute('data-state', 'selected');
  });
});

describe('TableHead', () => {
  it('renders with default props', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header Cell</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    const th = screen.getByRole('columnheader');
    expect(th).toHaveClass(
      'h-12',
      'px-4',
      'text-left',
      'align-middle',
      'font-medium',
      'text-muted-foreground',
      '[&:has([role=checkbox])]:pr-0'
    );
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='custom-head'>Header Cell</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    const th = screen.getByRole('columnheader');
    expect(th).toHaveClass('custom-head');
  });
});

describe('TableCell', () => {
  it('renders with default props', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Data Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const td = screen.getByRole('cell');
    expect(td).toHaveClass('p-4', 'align-middle', '[&:has([role=checkbox])]:pr-0');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className='custom-cell'>Data Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const td = screen.getByRole('cell');
    expect(td).toHaveClass('custom-cell');
  });
});

describe('TableCaption', () => {
  it('renders with default props', () => {
    render(
      <Table>
        <TableCaption>Table Caption</TableCaption>
      </Table>
    );
    const caption = screen.getByText('Table Caption');
    expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableCaption className='custom-caption'>Table Caption</TableCaption>
      </Table>
    );
    const caption = screen.getByText('Table Caption');
    expect(caption).toHaveClass('custom-caption');
  });
});

describe('Table composition', () => {
  it('renders a complete table structure', () => {
    render(
      <Table>
        <TableCaption>Well Production Data</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Well Name</TableHead>
            <TableHead>Production (bbl)</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Well #1</TableCell>
            <TableCell>150.5</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Well #2</TableCell>
            <TableCell>200.0</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>350.5</TableCell>
            <TableCell>2 Active</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByText('Well Production Data')).toBeInTheDocument();
    expect(screen.getByText('Well Name')).toBeInTheDocument();
    expect(screen.getByText('Production (bbl)')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Well #1')).toBeInTheDocument();
    expect(screen.getByText('150.5')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('350.5')).toBeInTheDocument();
  });

  it('handles empty table body', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column 1</TableHead>
            <TableHead>Column 2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{/* Empty body */}</TableBody>
      </Table>
    );

    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
    // Should not have any data rows
    expect(screen.queryByRole('cell')).not.toBeInTheDocument();
  });
});
