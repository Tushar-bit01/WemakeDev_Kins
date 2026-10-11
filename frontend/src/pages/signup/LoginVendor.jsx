import React, { useState, useCallback } from 'react'
import LeftSide from '../../components/signup/LeftSide'
import RightSideLoginVendor from '../../components/signupvendor/RightSideLoginVendor'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'

const LoginVendor = () => {
  const [riveControls, setRiveControls] = useState(null);

  const handleRiveReady = useCallback((controls) => {
    setRiveControls(controls);
  }, []);

  return (
    <div className="relative h-screen w-screen">
      <Link
        className="absolute top-6 left-6 flex items-center gap-1 text-base font-medium hover:opacity-80 font-[font3] font-bold z-10"
        to="/"
      >
        <FontAwesomeIcon icon={faAngleLeft} />
        Go back
      </Link>

      <div className="flex h-full w-full">
        <LeftSide onRiveReady={handleRiveReady} />
        <RightSideLoginVendor riveControls={riveControls} />
      </div>
    </div>
  )
}

export default LoginVendor