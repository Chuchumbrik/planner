import { useContext } from 'react'
import { DefectReportContext, type DefectReportContextValue } from '@/defect/defectReportContext'

export function useDefectReport(): DefectReportContextValue {
  const v = useContext(DefectReportContext)
  if (!v) throw new Error('useDefectReport must be used within DefectReportProvider')
  return v
}
