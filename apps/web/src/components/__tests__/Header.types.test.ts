/**
 * TypeScript type safety tests for Header component
 * These tests verify that the component interfaces and types are correct
 */

import type { ComponentProps } from 'react';
import type Header from '../Header';

// Type tests - these will fail at compile time if types are wrong
type HeaderProps = ComponentProps<typeof Header>;

// Verify HeaderProps interface
const validHeaderProps: HeaderProps = {
  onSearch: (query: string) => console.log(query),
  searchQuery: 'test',
  showSearch: true,
};

const minimalHeaderProps: HeaderProps = {};

// Test optional props
const optionalPropsTest: HeaderProps = {
  onSearch: undefined,
  searchQuery: undefined,
  showSearch: undefined,
};

// Test function signatures
const testSearchHandler = (query: string): void => {
  // This should accept string parameter
  console.log(query);
};

const validPropsWithHandler: HeaderProps = {
  onSearch: testSearchHandler,
};

// Type assertions for compile-time verification
export type HeaderTypeTests = {
  // Verify props are optional
  propsAreOptional: HeaderProps extends {} ? true : false;
  
  // Verify search query is string
  searchQueryIsString: HeaderProps['searchQuery'] extends string | undefined ? true : false;
  
  // Verify showSearch is boolean
  showSearchIsBoolean: HeaderProps['showSearch'] extends boolean | undefined ? true : false;
  
  // Verify onSearch function signature
  onSearchIsFunction: HeaderProps['onSearch'] extends ((query: string) => void) | undefined ? true : false;
};

// These should all be true
const typeTestResults: HeaderTypeTests = {
  propsAreOptional: true,
  searchQueryIsString: true,
  showSearchIsBoolean: true,
  onSearchIsFunction: true,
};

// Export to prevent "unused" warnings
export { 
  validHeaderProps, 
  minimalHeaderProps, 
  optionalPropsTest, 
  validPropsWithHandler,
  typeTestResults 
};