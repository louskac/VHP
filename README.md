# Verified Human Protocol (VHP)

A Web3 CAPTCHA alternative that verifies users through challenge-based activities or Nocena profile verification.

## Installation

```bash
npm install @nocena/vhp
# or
pnpm add @nocena/vhp
```

## Quick Start

```jsx
import { VHPCaptcha } from '@nocena/vhp';

function App() {
  const handleVerified = (token) => {
    // User has been verified
    console.log('Verification token:', token);
  };

  const handleFailed = (error) => {
    console.error('Verification failed:', error);
  };

  return (
    <VHPCaptcha
      onVerified={handleVerified}
      onFailed={handleFailed}
    />
  );
}
```

## Features

- 🔐 Web3-based human verification
- 📸 Challenge-based verification (photo/video/selfie)
- 👤 Nocena profile login option
- 🌎 World profile login option
- 🪙 Token rewards for successful verification
- 🎨 Customizable appearance
- 📱 Mobile-friendly

## API

### VHPCaptcha Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| onVerified | `(token: string) => void` | Callback when verification succeeds | Required |
| onFailed | `(error: string) => void` | Callback when verification fails | Optional |
| apiEndpoint | `string` | Custom API endpoint for verification | `/api/vhp/verify` |
| className | `string` | Additional CSS classes | `''` |

## Development

### Prerequisites

The VHP component uses camera access for challenge verification. Due to browser security requirements, camera access only works in secure contexts (HTTPS). For local development, you'll need to set up HTTPS.

### Setting up HTTPS for Local Development

1. **Install mkcert** (for creating local SSL certificates):
   ```bash
   # macOS
   brew install mkcert
   brew install nss # if you use Firefox
   
   # Windows
   choco install mkcert
   
   # Linux
   sudo apt install libnss3-tools
   # Then download and install mkcert from GitHub
   ```

2. **Create local certificates**:
   ```bash
   # Install the local CA
   mkcert -install
   
   # Create certificate files in your project
   mkdir certificates
   cd certificates
   mkcert localhost
   ```

3. **Run the HTTPS development server**:
   ```bash
   # Install dependencies
   pnpm install
   
   # Run development server with HTTPS
   pnpm dev:https
   ```

4. **Access the app** at `https://localhost:3000`
   
   Note: Your browser may show a security warning about the self-signed certificate. This is normal for local development - just proceed to the site.

### Regular Development

```bash
# Install dependencies
pnpm install

# Run development server (HTTP - camera features won't work)
pnpm dev

# Run development server with HTTPS (camera features will work)
pnpm dev:https

# Build the package
pnpm build:package
```

### Camera Access Requirements

- **HTTPS is required** for camera access in all modern browsers
- For local development, use the HTTPS setup described above
- In production, ensure your site is served over HTTPS
- Users must grant camera permissions when prompted

## License

MIT © Nocena