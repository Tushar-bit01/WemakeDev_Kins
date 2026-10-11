import React from 'react';
import Hero from '../../components/home/hero/Hero';
import Feature from '../../components/home/feature/Feature';
import Footer from '../../components/home/footer/Footer';
import HomePricing from '../../components/Pricing/HomePricing';
import FAQ from '../../components/home/faq/FAQ';
import WhyUs from '../../components/home/whyus/WhyUs';
import OldVsNew from '../../components/home/oldvsnew/OldVsNew';
import ProductDemo from '../../components/home/productdemo/ProductDemo';

const Home = () => {
  return (
    <div>
      <Hero/>
      {/* <Feature/> */}
      <WhyUs/>
      <OldVsNew/>
      <div id="product-demo">
      <ProductDemo />
      </div>
      
      <HomePricing/>
      <FAQ/>
      <Footer/>
    </div>
  );
};

export default Home;