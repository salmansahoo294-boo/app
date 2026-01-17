from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.getenv('SENDGRID_API_KEY')
        self.sender_email = os.getenv('SENDER_EMAIL', 'noreply@winpkr.com')
        self.admin_email = os.getenv('ADMIN_EMAIL', 'admin@winpkr.com')
        
    def send_email(self, to: str, subject: str, html_content: str) -> bool:
        """Send email via SendGrid"""
        if not self.api_key:
            logger.warning("SendGrid API key not configured. Email not sent.")
            return False
            
        try:
            message = Mail(
                from_email=self.sender_email,
                to_emails=to,
                subject=subject,
                html_content=html_content
            )
            
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            
            if response.status_code == 202:
                logger.info(f"Email sent successfully to {to}")
                return True
            else:
                logger.error(f"Failed to send email. Status: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    def send_deposit_notification(self, user_email: str, user_name: str, amount: float, jazzcash_number: str, deposit_id: str) -> bool:
        """Send deposit notification to admin"""
        subject = f"🔔 New Deposit Request - PKR {amount:,.2f}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #FFD700; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">New Deposit Request</h2>
                    
                    <div style="margin: 20px 0; padding: 20px; background-color: #050505; color: white; border-radius: 8px;">
                        <p style="margin: 10px 0;"><strong style="color: #FFD700;">Deposit ID:</strong> {deposit_id}</p>
                        <p style="margin: 10px 0;"><strong style="color: #FFD700;">User Email:</strong> {user_email}</p>
                        <p style="margin: 10px 0;"><strong style="color: #FFD700;">User Name:</strong> {user_name or 'Not provided'}</p>
                        <p style="margin: 10px 0;"><strong style="color: #FFD700;">Amount:</strong> PKR {amount:,.2f}</p>
                        <p style="margin: 10px 0;"><strong style="color: #FFD700;">JazzCash Number:</strong> {jazzcash_number}</p>
                    </div>
                    
                    <p style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404;">
                        <strong>Action Required:</strong> Please review and approve/reject this deposit request in the Admin Panel.
                    </p>
                    
                    <p style="color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px;">
                        This is an automated notification from WINPKR HUB Admin System.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self.send_email(self.admin_email, subject, html_content)
    
    def send_withdrawal_notification(self, user_email: str, user_name: str, amount: float, jazzcash_number: str, withdrawal_id: str) -> bool:
        """Send withdrawal notification to admin"""
        subject = f"💰 New Withdrawal Request - PKR {amount:,.2f}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #00FF94; border-bottom: 2px solid #00FF94; padding-bottom: 10px;">New Withdrawal Request</h2>
                    
                    <div style="margin: 20px 0; padding: 20px; background-color: #050505; color: white; border-radius: 8px;">
                        <p style="margin: 10px 0;"><strong style="color: #00FF94;">Withdrawal ID:</strong> {withdrawal_id}</p>
                        <p style="margin: 10px 0;"><strong style="color: #00FF94;">User Email:</strong> {user_email}</p>
                        <p style="margin: 10px 0;"><strong style="color: #00FF94;">User Name:</strong> {user_name or 'Not provided'}</p>
                        <p style="margin: 10px 0;"><strong style="color: #00FF94;">Amount:</strong> PKR {amount:,.2f}</p>
                        <p style="margin: 10px 0;"><strong style="color: #00FF94;">JazzCash Number:</strong> {jazzcash_number}</p>
                    </div>
                    
                    <p style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404;">
                        <strong>Action Required:</strong> Please review KYC status and approve/reject this withdrawal request in the Admin Panel.
                    </p>
                    
                    <p style="color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px;">
                        This is an automated notification from WINPKR HUB Admin System.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self.send_email(self.admin_email, subject, html_content)
    
    def send_deposit_approved_email(self, user_email: str, amount: float) -> bool:
        """Send deposit approval notification to user"""
        subject = "✅ Deposit Approved - WinPKR"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #00FF94;">Deposit Approved!</h2>
                    <p>Your deposit of <strong>PKR {amount:,.2f}</strong> has been approved and credited to your wallet.</p>
                    <p>You can now start playing your favorite games!</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">Thank you for choosing WinPKR</p>
                </div>
            </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)
    
    def send_withdrawal_approved_email(self, user_email: str, amount: float, jazzcash_number: str) -> bool:
        """Send withdrawal approval notification to user"""
        subject = "✅ Withdrawal Processed - WinPKR"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #00FF94;">Withdrawal Processed!</h2>
                    <p>Your withdrawal of <strong>PKR {amount:,.2f}</strong> has been processed.</p>
                    <p>The amount will be transferred to your JazzCash number: <strong>{jazzcash_number}</strong></p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">Thank you for playing at WinPKR</p>
                </div>
            </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)

email_service = EmailService()
