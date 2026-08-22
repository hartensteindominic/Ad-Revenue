const items=[
  {id:'stanley-quencher-40oz',name:'Quencher H2.0 FlowState 40 oz',creator:'Stanley 1913',type:'Drinkware',family:'artifact',material:'ceramic',rarity:'Common',sourcePriceUsd:45,sourceName:'Stanley 1913 official store',sourceUrl:'https://www.stanley1913.com/products/adventure-quencher-travel-tumbler-40-oz',previewUri:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; external exact model not verified',resaleEligible:false},
  {id:'sony-wh1000xm5',name:'WH-1000XM5',creator:'Sony',type:'Headphones',family:'artifact',material:'metallic',rarity:'Rare',sourcePriceUsd:399,sourceName:'Sony official product source',sourceUrl:'https://www.sony.com/electronics/support/headphones-group-headband-headphones/wh-1000xm5',previewUri:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; external exact model not verified',resaleEligible:false},
  {id:'apple-airpods-pro-3',name:'AirPods Pro 3',creator:'Apple',type:'Audio',family:'artifact',material:'ceramic',rarity:'Rare',sourcePriceUsd:249,sourceName:'Apple official product source',sourceUrl:'https://www.apple.com/airpods-pro/',previewUri:'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; exact licensed asset not verified',resaleEligible:false},
  {id:'nike-air-force-1-07',name:'Air Force 1 07',creator:'Nike',type:'Footwear',family:'artifact',material:'stone',rarity:'Rare',sourcePriceUsd:115,sourceName:'Nike official product source',sourceUrl:'https://www.nike.com/w/air-force-1-shoes-5sjg7zy7ok',previewUri:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; external exact model not verified',resaleEligible:false},
  {id:'apple-iphone-15-pro',name:'iPhone 15 Pro',creator:'Apple',type:'Phone',family:'robot',material:'metallic',rarity:'Rare',sourcePriceUsd:999,sourceName:'Apple official product source',sourceUrl:'https://www.apple.com/iphone-15-pro/',previewUri:'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; exact licensed asset not verified',resaleEligible:false},
  {id:'playstation-5',name:'PlayStation 5',creator:'Sony Interactive Entertainment',type:'Gaming',family:'architecture',material:'ceramic',rarity:'Epic',sourcePriceUsd:499,sourceName:'PlayStation Direct official source',sourceUrl:'https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1tb',previewUri:'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; external exact model not verified',resaleEligible:false},
  {id:'gopro-hero',name:'GoPro HERO',creator:'GoPro',type:'Camera',family:'artifact',material:'obsidian',rarity:'Uncommon',sourcePriceUsd:299,sourceName:'GoPro official product source',sourceUrl:'https://gopro.com/en/us/shop/cameras',previewUri:'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; external exact model not verified',resaleEligible:false},
  {id:'rolex-submariner',name:'Submariner',creator:'Rolex',type:'Watch',family:'artifact',material:'gold',rarity:'Mythic',sourcePriceUsd:null,priceUsd:null,priceDisplay:'Price on request',sourceName:'Rolex official collection source',sourceUrl:'https://www.rolex.com/watches/submariner',previewUri:'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; exact licensed asset not verified',resaleEligible:false},
  {id:'rayban-wayfarer-rb2140',name:'Original Wayfarer',creator:'Ray-Ban',type:'Eyewear',family:'artifact',material:'obsidian',rarity:'Rare',sourcePriceUsd:196,sourceName:'Ray-Ban official product source',sourceUrl:'https://www.ray-ban.com/usa/sunglasses/original-wayfarer',previewUri:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85',modelSource:'Voxel Vault local 3D twin; exact licensed asset not verified',resaleEligible:false},
];

function priceWithMarkup(basePrice, markupPercent=25) {
  if (basePrice === null || basePrice === undefined || basePrice === '') return null;
  const numeric=Number(basePrice);
  if (!Number.isFinite(numeric)) return null;
  return (Math.ceil(numeric * (1 + markupPercent / 100) * 100) / 100).toFixed(2);
}

export const REAL_WORLD_CATALOG=items.map((item,index)=>{
  const markupPercent=25;
  const hasNumericSourcePrice=item.sourcePriceUsd !== null && item.sourcePriceUsd !== undefined && item.sourcePriceUsd !== '' && Number.isFinite(Number(item.sourcePriceUsd));
  const basePriceUsd=hasNumericSourcePrice ? Number(item.sourcePriceUsd) : null;
  const customerPriceUsd=hasNumericSourcePrice ? priceWithMarkup(basePriceUsd,markupPercent) : null;
  return {
    ...item,
    id:item.id||`real-object-${index+1}`,
    price:item.priceDisplay || (basePriceUsd !== null ? String(basePriceUsd) : null),
    priceDisplay:item.priceDisplay || (customerPriceUsd ? `$${customerPriceUsd}` : 'Price on request'),
    customerPriceUsd,
    basePriceUsd,
    blocks:'Real product source',
    variant:'real-world product',
    inspiration:item.name,
    physicalSource:item.sourceUrl,
    modelUri:null,
    digitalTwin:{modelUrl:null,previewUrl:item.previewUri,source:item.modelSource,license:null,status:'3D NFT TWIN',exactModelVerified:false},
    isRealWorld:true,
    isSynthetic:false,
    sourceVerified:true,
    resaleEligible:Boolean(item.resaleEligible),
    fulfillmentReady:false,
    pricingModel:basePriceUsd === null ? 'price-on-request' : 'source-price-plus-vault-markup',
    markupPercent,
    markupConfigured:Boolean(basePriceUsd),
    priceIncludesVaultMarkup:Boolean(basePriceUsd),
    renderMode:'3d-twin-first',
    seed:`real-${item.id}`,
  };
});

export const getRealWorldCatalog=()=>REAL_WORLD_CATALOG.slice();
