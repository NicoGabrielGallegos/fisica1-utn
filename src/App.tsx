import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import CalculatorPage from './pages/CalculatorPage'
import FormulaPage from './pages/FormulaPage'
import GeneralCalculatorPage from './pages/GeneralCalculatorPage'
import Home from './pages/Home'
import SectionPage from './pages/SectionPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:sectionId" element={<SectionPage />} />
        <Route path="/:sectionId/calculadora/:calculatorId" element={<CalculatorPage />} />
        <Route path="/:sectionId/formula/:formulaId" element={<FormulaPage />} />
        <Route path="/:sectionId/general" element={<GeneralCalculatorPage />} />
      </Route>
    </Routes>
  )
}

export default App
