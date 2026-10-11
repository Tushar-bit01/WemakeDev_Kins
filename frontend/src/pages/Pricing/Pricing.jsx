import React from 'react'
import PricingSolar from '../../components/Pricing/Pricingsolar'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons'

const Pricing = () => {
  return (
    <div>
        <Link
        className="absolute top-6 left-6 flex items-center gap-1 text-base font-medium hover:opacity-80 font-[font3] font-bold z-10"
        to="/"
      >
        <FontAwesomeIcon icon={faAngleLeft} />
        Go back
      </Link>
        <PricingSolar/>
    </div>
  )
}

export default Pricing