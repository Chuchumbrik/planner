import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'
import * as axeMatchers from 'vitest-axe/matchers'

// Register the axe matcher so any test can assert `toHaveNoViolations()`.
expect.extend(axeMatchers)

afterEach(() => cleanup())
