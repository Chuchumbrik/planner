import { createContext } from 'react'

export type DefectReportContextValue = {
  openDefectReport: () => void
  closeDefectReport: () => void
}

export const DefectReportContext = createContext<DefectReportContextValue | null>(null)
