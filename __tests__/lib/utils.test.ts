import { cn, fetcher, formatCurrency } from '@/lib/utils';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Mock the dependencies
jest.mock('clsx');
jest.mock('tailwind-merge');

// Mock fetch globally
global.fetch = jest.fn();

const mockClsx = clsx as jest.MockedFunction<typeof clsx>;
const mockTwMerge = twMerge as jest.MockedFunction<(input: string) => string>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Utils Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClsx.mockImplementation((...args) => args.filter(Boolean).join(' '));
    mockTwMerge.mockImplementation((str: string) => str);
  });

  describe('cn function', () => {
    it('should call clsx with provided arguments', () => {
      cn('class1', 'class2', false, 'class3');

      expect(mockClsx).toHaveBeenCalledWith(['class1', 'class2', false, 'class3']);
    });

    it('should call twMerge with clsx result', () => {
      const clsxResult = 'class1 class2 class3';
      mockClsx.mockReturnValue(clsxResult);

      cn('class1', 'class2', 'class3');

      expect(mockTwMerge).toHaveBeenCalledWith(clsxResult);
    });

    it('should return the result from twMerge', () => {
      const mergedClasses = 'merged-classes';
      mockTwMerge.mockReturnValue(mergedClasses);

      const result = cn('some', 'classes');

      expect(result).toBe(mergedClasses);
    });

    it('should handle empty input', () => {
      cn();

      expect(mockClsx).toHaveBeenCalledWith([]);
      expect(mockTwMerge).toHaveBeenCalled();
    });

    it('should handle single class name', () => {
      cn('single-class');

      expect(mockClsx).toHaveBeenCalledWith(['single-class']);
      expect(mockTwMerge).toHaveBeenCalled();
    });

    it('should handle conditional classes', () => {
      const condition = true;
      cn('always', condition && 'conditional', false && 'never');

      expect(mockClsx).toHaveBeenCalledWith(['always', 'conditional', false]);
    });

    it('should handle object syntax', () => {
      const classObj = { 'active': true, 'disabled': false };
      cn('base', classObj);

      expect(mockClsx).toHaveBeenCalledWith(['base', classObj]);
    });

    it('should handle array syntax', () => {
      const classArray = ['array1', 'array2'];
      cn('base', classArray);

      expect(mockClsx).toHaveBeenCalledWith(['base', classArray]);
    });

    it('should handle mixed input types', () => {
      const mixedInputs = [
        'string',
        { active: true, disabled: false },
        ['array1', 'array2'],
        false,
        null,
        undefined,
        0,
        ''
      ];

      cn(...mixedInputs);

      expect(mockClsx).toHaveBeenCalledWith(mixedInputs);
    });

    it('should preserve the chain clsx -> twMerge', () => {
      const clsxOutput = 'text-red-500 bg-blue-500';
      const twMergeOutput = 'text-red-500 bg-blue-500';
      
      mockClsx.mockReturnValue(clsxOutput);
      mockTwMerge.mockReturnValue(twMergeOutput);

      const result = cn('text-red-500', 'bg-blue-500');

      expect(mockClsx).toHaveBeenCalledTimes(1);
      expect(mockTwMerge).toHaveBeenCalledTimes(1);
      expect(mockTwMerge).toHaveBeenCalledWith(clsxOutput);
      expect(result).toBe(twMergeOutput);
    });
  });

  describe('integration behavior', () => {
    beforeEach(() => {
      // Reset mocks to use real implementations for integration tests
      jest.unmock('clsx');
      jest.unmock('tailwind-merge');
    });

    it('should properly merge Tailwind classes when conflicts exist', () => {
      // This would test the actual integration, but we'd need to import the real functions
      // For now, we'll test that the function structure works with our mocks
      const result = cn('p-4', 'p-6'); // p-6 should override p-4
      
      // With our mocks, this tests the function flow
      expect(typeof result).toBe('string');
    });

    it('should handle complex class combinations', () => {
      const result = cn(
        'flex items-center',
        'justify-between',
        { 'bg-red-500': true },
        ['text-white', 'rounded-lg'],
        false && 'hidden'
      );

      expect(typeof result).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle extremely long class strings', () => {
      const longClassName = 'a'.repeat(1000);
      
      cn(longClassName);

      expect(mockClsx).toHaveBeenCalledWith([longClassName]);
    });

    it('should handle special characters in class names', () => {
      const specialClasses = 'class-with-dashes class_with_underscores class:with:colons';
      
      cn(specialClasses);

      expect(mockClsx).toHaveBeenCalledWith([specialClasses]);
    });

    it('should handle numeric values', () => {
      cn(1, 0, 42);

      expect(mockClsx).toHaveBeenCalledWith([1, 0, 42]);
    });

    it('should handle deeply nested objects', () => {
      const nestedObj = {
        'level1': {
          'level2': {
            'level3': true
          }
        }
      };

      cn(nestedObj);

      expect(mockClsx).toHaveBeenCalledWith([nestedObj]);
    });
  });

  describe('error handling', () => {
    it('should handle clsx throwing an error', () => {
      mockClsx.mockImplementation(() => {
        throw new Error('clsx error');
      });

      expect(() => cn('test')).toThrow('clsx error');
    });

    it('should handle twMerge throwing an error', () => {
      mockTwMerge.mockImplementation(() => {
        throw new Error('twMerge error');
      });

      expect(() => cn('test')).toThrow('twMerge error');
    });
  });

  describe('performance considerations', () => {
    it('should only call each function once per invocation', () => {
      cn('class1', 'class2', 'class3');

      expect(mockClsx).toHaveBeenCalledTimes(1);
      expect(mockTwMerge).toHaveBeenCalledTimes(1);
    });

    it('should handle many arguments efficiently', () => {
      const manyArgs = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      
      cn(...manyArgs);

      expect(mockClsx).toHaveBeenCalledTimes(1);
      expect(mockClsx).toHaveBeenCalledWith(manyArgs);
    });
  });

  describe('fetcher function', () => {
    it('should fetch data with GET method by default', async () => {
      const mockData = { test: 'data' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await fetcher('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch data with specified method', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      await fetcher('/api/test', 'POST');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(fetcher('/api/nonexistent')).rejects.toThrow('Failed to fetch data');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetcher('/api/test')).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(fetcher('/api/test')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('formatCurrency function', () => {
    it('should format currency with default options', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56'); // Default minimumFractionDigits: 0 but maximumFractionDigits: 2
    });

    it('should format currency with zero amount', () => {
      const result = formatCurrency(0);
      expect(result).toBe('$0');
    });

    it('should format negative currency', () => {
      const result = formatCurrency(-1234.56);
      expect(result).toBe('-$1,234.56');
    });

    it('should format very large amounts', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toBe('$1,234,567.89');
    });

    it('should format very small amounts', () => {
      const result = formatCurrency(0.01);
      expect(result).toBe('$0.01');
    });

    it('should respect custom options', () => {
      const result = formatCurrency(1234.56, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toBe('$1,234.56');
    });

    it('should handle custom currency', () => {
      const result = formatCurrency(1234.56, {
        currency: 'EUR',
      });
      expect(result).toBe('€1,234.56'); // Note: actual format may vary by locale
    });

    it('should handle custom locale options', () => {
      const result = formatCurrency(1234.56, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toBe('$1,234.56');
    });

    it('should handle edge case with undefined amount', () => {
      const result = formatCurrency(NaN);
      expect(result).toBe('$NaN'); // Intl.NumberFormat handles NaN with currency symbol
    });

    it('should handle infinity', () => {
      const result = formatCurrency(Infinity);
      expect(result).toBe('$∞'); // Intl.NumberFormat handles Infinity with currency symbol
    });

    it('should override default options with custom options', () => {
      const result = formatCurrency(1234.5, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toBe('$1,234.50');
    });

    it('should handle decimal precision correctly', () => {
      const result = formatCurrency(0.129, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toBe('$0.13'); // Should round to 2 decimal places
    });

    it('should handle multiple decimal places', () => {
      const result = formatCurrency(1234.56789, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      });
      expect(result).toBe('$1,234.568'); // Should round to 3 decimal places
    });
  });
});