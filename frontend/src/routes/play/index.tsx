import { createFileRoute } from '@tanstack/react-router'
import ServiceLandingPlay from '../../pages/play/ServiceLanding'

export const Route = createFileRoute('/play/')({
  component: ServiceLandingPlay,
})