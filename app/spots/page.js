import VaultFlowNav from '../components/VaultFlowNav';
import VaultSpotsExperience from '../components/VaultSpotsExperience';

export const metadata = {
  title: 'Vault Spots · Voxel Vault',
  description: 'Turn places you return to into persistent Voxel Vault experiences.',
};

export default function VaultSpotsPage() {
  return (
    <>
      <VaultFlowNav />
      <VaultSpotsExperience />
    </>
  );
}
