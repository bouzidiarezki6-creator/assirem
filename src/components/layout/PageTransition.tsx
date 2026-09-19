import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useLocation, useOutlet } from "react-router-dom"
import { pageTransition } from "@/lib/motion"

export default function PageTransition() {
  const location = useLocation()
  const outlet = useOutlet()
  const prefersReduced = useReducedMotion()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready || prefersReduced) {
    return <div key={location.pathname}>{outlet}</div>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        transition={pageTransition.transition}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}
