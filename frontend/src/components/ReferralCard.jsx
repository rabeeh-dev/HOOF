import React from 'react';
import { Card, Typography, Button, Input, message } from 'antd';
import { FaCopy, FaShareAlt } from 'react-icons/fa';

const { Text, Paragraph } = Typography;

const ReferralCard = ({ referralCode = '' }) => {
  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    message.success('Referral code copied to clipboard!');
  };

  const handleShare = () => {
    if (!referralCode) return;
    const shareText = `Join HOOF Premium Footwear and use my referral code: ${referralCode} to get exclusive signup benefits! http://localhost:5173/signup?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'HOOF Footwear Referrals',
        text: shareText,
        url: 'http://localhost:5173/signup'
      }).catch(err => console.log('Share dismissed:', err));
    } else {
      navigator.clipboard.writeText(shareText);
      message.success('Referral link copied to clipboard!');
    }
  };

  return (
    <Card title="Refer a Friend" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <Paragraph style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
        Share your unique referral code with friends. When they complete signup, both of you earn credit points that can be converted directly into wallet funds!
      </Paragraph>

      <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
        <Input 
          value={referralCode} 
          readOnly 
          style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '16px', letterSpacing: 1, textAlign: 'center' }} 
        />
        <Button 
          icon={<FaCopy />} 
          onClick={handleCopy} 
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          Copy
        </Button>
        <Button 
          type="primary" 
          icon={<FaShareAlt />} 
          onClick={handleShare}
          style={{ background: '#c41e3a', borderColor: '#c41e3a', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          Share
        </Button>
      </div>
    </Card>
  );
};

export default ReferralCard;
