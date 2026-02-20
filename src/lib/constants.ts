export const SERVICE_PHONE = "052-6409993";
export const STUDIO_NAME = "עונג של פילאטיס";
export const ADMIN_EMAILS = ['hilaglazz13@gmail.com', 'oneg3gri@gmail.com'].map(email => email.toLowerCase());;;
export const SERVICE_EMAIL = "oneg3gri@gmail.com"


// פונקציית עזר לייצירת לינק לוואטסאפ בקלות
export const getWhatsAppLink = (message: string) => {
  const cleanPhone = SERVICE_PHONE.replace(/\D/g, '').replace(/^0/, '972');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};