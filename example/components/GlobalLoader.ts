import React, { forwardRef, useEffect } from 'react'
import { Box, useSnackbar } from '@woorcs/design-system'
import { useNProgress } from '@tanem/react-nprogress'
import { animated, useSpring } from 'react-spring'

// import { useApolloNetworkStatus } from '../../../graphql/useCreateClient'

const AnimatedBox = animated(Box)

type ProgressProps = {
  progress: number
  isFinished: boolean
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ progress, isFinished }, ref) => {
    const containerStyle = useSpring({
      from: {
        opacity: 0
      },
      opacity: isFinished ? 0 : 1,
      delay: isFinished ? 200 : 0
    })
    const progressBarStyle = useSpring({
      transform: `scaleX(${progress})`,
      immediate: isFinished
    })

    return (
      <AnimatedBox
        style={containerStyle}
        css={{
          willChange: 'opacity'
        }}
        position='fixed'
        top={0}
        left={0}
        right={0}
        zIndex={1100}
        height={4}
        width='100%'
        bg='grey.100'
      >
        <AnimatedBox
          ref={ref}
          style={progressBarStyle}
          css={{
            transformOrigin: '0% 50%',
            willChange: 'transform'
          }}
          height={4}
          width='100%'
          bg='primary.500'
        />
      </AnimatedBox>
    )
  }
)

export const GlobalLoadingIndicator = () => {
  // const status = useApolloNetworkStatus()
  const status = {
    numPendingQueries: 0,
    queryError: null
  }
  const { showSnackbar } = useSnackbar()

  const { isFinished, progress } = useNProgress({
    isAnimating: status.numPendingQueries > 0
  })

  useEffect(() => {
    if (!status.queryError) {
      return
    }

    showSnackbar({
      title: 'Request failed',
      variant: 'danger'
    })
  }, [showSnackbar, status.queryError])

  return <Progress progress={progress} isFinished={isFinished} />
}
