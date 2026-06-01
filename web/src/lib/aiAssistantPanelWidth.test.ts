import { beforeEach, describe, expect, it } from 'vitest'
import {
  AI_PANEL_WIDTH_DEFAULT,
  AI_PANEL_WIDTH_MAX,
  AI_PANEL_WIDTH_MIN,
  readAiAssistantPanelWidth,
  writeAiAssistantPanelWidth,
} from './aiAssistantPanelWidth'

const STORAGE_KEY = 'motivator-ai-panel-width'

beforeEach(() => {
  localStorage.clear()
})

describe('readAiAssistantPanelWidth', () => {
  // TS-089
  it('localStorage пуст → default (384)', () => {
    expect(readAiAssistantPanelWidth()).toBe(AI_PANEL_WIDTH_DEFAULT)
  })

  // TS-090
  it("значение ниже MIN ('100') → 280 (MIN)", () => {
    localStorage.setItem(STORAGE_KEY, '100')
    expect(readAiAssistantPanelWidth()).toBe(AI_PANEL_WIDTH_MIN)
  })
})

describe('writeAiAssistantPanelWidth', () => {
  // TS-091
  it('600 → clamp до 560 (MAX) в localStorage', () => {
    writeAiAssistantPanelWidth(600)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(String(AI_PANEL_WIDTH_MAX))
  })
})
