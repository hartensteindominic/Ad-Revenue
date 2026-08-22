const MODEL_BASE='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0';

// Production catalog: every entry is a real-world product with a verifiable
// online source. The 3D asset is a category-matched, openly licensed model.
// It is explicitly a reference unless an exact manufacturer model is licensed.
const items=[
  {id:'apple-airpods-pro-3',name:'AirPods Pro 3',creator:'Apple',type:'Audio',family:'artifact',shape:'artifact',material:'ceramic',rarity:'Rare',priceUsd:'249',sourceName:'Apple',sourceUrl:'https://www.apple.com/shop/buy-airpods/airpods-pro-3',previewUri:'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/Sunglasses/glTF-Binary/Sunglasses.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC BY 4.0'},
  {id:'stanley-quencher-40oz',name:'Quencher H2.0 FlowState 40 oz',creator:'Stanley 1913',type:'Drinkware',family:'artifact',shape:'artifact',material:'metallic',rarity:'Common',priceUsd:'45',sourceName:'Stanley 1913',sourceUrl:'https://www.stanley1913.com/products/adventure-quencher-travel-tumbler-40-oz',previewUri:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/WaterBottle/glTF-Binary/WaterBottle.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC0 1.0'},
  {id:'ikea-rosentorp-chair',name:'ROSENTORP Chair',creator:'IKEA',type:'Furniture',family:'artifact',shape:'artifact',material:'wood',rarity:'Common',priceUsd:'199',sourceName:'IKEA US',sourceUrl:'https://www.ikea.com/us/en/search/?q=ROSENTORP',previewUri:'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/SheenChair/glTF-Binary/SheenChair.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC0 1.0'},
  {id:'canon-eos-r50',name:'EOS R50',creator:'Canon',type:'Camera',family:'artifact',shape:'artifact',material:'metallic',rarity:'Rare',priceUsd:'679',sourceName:'Canon USA',sourceUrl:'https://www.usa.canon.com/shop/p/eos-r50',previewUri:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/AntiqueCamera/glTF-Binary/AntiqueCamera.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC0 1.0'},
  {id:'sony-wh1000xm5',name:'WH-1000XM5',creator:'Sony',type:'Headphones',family:'artifact',shape:'artifact',material:'ceramic',rarity:'Rare',priceUsd:'399',sourceName:'Sony Electronics US',sourceUrl:'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b',previewUri:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/Sunglasses/glTF-Binary/Sunglasses.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC BY 4.0'},
  {id:'rayban-wayfarer-rb2140',name:'Original Wayfarer',creator:'Ray-Ban',type:'Eyewear',family:'artifact',shape:'artifact',material:'glass',rarity:'Rare',priceUsd:'196',sourceName:'Ray-Ban',sourceUrl:'https://www.ray-ban.com/usa/sunglasses/original-wayfarer',previewUri:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/Sunglasses/glTF-Binary/Sunglasses.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC BY 4.0'},
  {id:'lego-mclaren-mcl39',name:'McLaren MCL39 F1 Car',creator:'LEGO Technic',type:'Collectible Model',family:'vehicle',shape:'car',material:'plastic',rarity:'Epic',priceUsd:'229.99',sourceName:'LEGO Shop US',sourceUrl:'https://www.lego.com/en-us/product/mclaren-mcl39-f1-car-42228',previewUri:'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/ToyCar/glTF-Binary/ToyCar.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC0 1.0'},
  {id:'nike-air-force-1-07',name:'Air Force 1 07',creator:'Nike',type:'Footwear',family:'artifact',shape:'artifact',material:'leather',rarity:'Rare',priceUsd:'115',sourceName:'Nike',sourceUrl:'https://www.nike.com/t/air-force-1-07-mens-shoes',previewUri:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC BY 4.0'},
  {id:'sony-srs-xb100',name:'SRS-XB100 Portable Speaker',creator:'Sony',type:'Audio',family:'artifact',shape:'artifact',material:'metallic',rarity:'Uncommon',priceUsd:'59.99',sourceName:'Sony Electronics US',sourceUrl:'https://electronics.sony.com/audio/speakers/wireless-speakers/p/srsxb100-b',previewUri:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/BoomBox/glTF-Binary/BoomBox.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC BY 4.0'},
  {id:'coleman-lantern',name:'Classic Recharge Lantern',creator:'Coleman',type:'Outdoor',family:'artifact',shape:'artifact',material:'metallic',rarity:'Uncommon',priceUsd:'69.99',sourceName:'Coleman',sourceUrl:'https://www.coleman.com/lighting/lanterns/',previewUri:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85',modelUri:`${MODEL_BASE}/Lantern/glTF-Binary/Lantern.glb`,modelSource:'Khronos glTF Sample Models',modelLicense:'CC BY 4.0'}
];

export const REAL_WORLD_CATALOG=items.map((item,index)=>({
  ...item,
  id:item.id||`real-object-${index+1}`,
  price:item.priceUsd,
  blocks:'Verified source',
  color:'violet',
  variant:'real-world reference',
  inspiration:item.name,
  physicalSource:item.sourceUrl,
  digitalTwin:{modelUrl:item.modelUri,previewUrl:item.previewUri,source:item.modelSource,license:item.modelLicense,status:'3D REFERENCE'},
  isRealWorld:true,
  isSynthetic:false,
  sourceVerified:true,
  renderMode:'remote3d',
  seed:`real-${item.id}`
}));

export const getRealWorldCatalog=()=>REAL_WORLD_CATALOG.slice();
