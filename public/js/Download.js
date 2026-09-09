import { createCanvas, loadImage, registerFont } from 'canvas';
import { writeFileSync } from 'fs';

// Register custom fonts for each language
registerFont('./Languages/English-Sans-Sarif/static/OpenSans-SemiBold.ttf', { family: 'english' });
registerFont('./Languages/Microsoft_YaHei_Bold.ttf', { family: 'Chinese' });
registerFont('./Languages/Arabic-fonts/static/NotoSansArabic-SemiBold.ttf', { family: 'arabic' });
registerFont('./Languages/French-Fonts/NotoSans-Light.ttf', { family: 'french' });
registerFont('./Languages/Russian-Fonts/NotoSans-Medium.ttf', { family: 'russian' });
registerFont('./Languages/Indonesian-fonts/NotoSerifBalinese-Regular.ttf', { family: 'indonesian' });
registerFont('./Languages/Portogiese-fonts/NotoSans-Medium.ttf', { family: 'portuguese' });
registerFont('./Languages/Urdu-fonts/static/NotoNastaliqUrdu-Regular.ttf', { family: 'urdu' });

const date = new Date();
console.log(date);
const day = date.getDate();
const month = date.getMonth() + 1;
const year = date.getFullYear();

const newDate = day + '/' + month + '/' + year;
console.log(newDate);


const languages = {
    'english': {
        certificateText: 'Surat Al-Fatiha Ijazah',
        proudText: 'This certificate is proudly presented to',
        emailText: 'mowakehhadnan@gmail.com',
        additionalText: 'for Surat Al-Fatiha recitation according to',
        surahfatiha: 'Surat Al-Fatiha',
        instructorName: 'Instructor: mowakehhadnan@gmail.com',
        date: newDate
    },
    'Chinese': {
        certificateText: '苏拉特·法蒂哈·伊贾扎',
        proudText: '此证书自豪地颁发给',
        emailText: 'mowakehhadnan@gmail.com',
        additionalText: '根据古兰经的背诵。',
        surahfatiha: '苏拉特·法蒂哈',
        instructorName: '教练：mowakehhadnan@gmail.com',
        date: newDate
    },
    'french': {
        certificateText: 'Ijazah de Surat Al-Fatiha',
        proudText: 'Ce certificat est fièrement décerné à',
        emailText: 'mowakehhadnan@gmail.com',
        additionalText: 'pour la récitation de la Sourate Al-Fatiha conformément à',
        surahfatiha: 'Sourate Al-Fatiha',
        instructorName: 'Instructeur : mowakehhadnan@gmail.com',
        date: newDate
    },
    'urdu': {
        certificateText: 'سورۃ الفاتحہ اجازہ',
        proudText: 'یہ سرٹیفکیٹ فخر سے پیش کیا گیا ہے',
        emailText: 'mowakehhadnan@gmail.com',
        additionalText: 'سورہ الفاتحہ کی تلاوت کے لئے',
        surahfatiha: 'سورہ الفاتحہ',
        instructorName: 'معلم: mowakehhadnan@gmail.com',
        date: newDate
    },
    'arabic': {
        certificateText: 'إجازة سورة الفاتحة',
        proudText: 'هذا الشهادة مقدمة بفخر لـ',
        emailText: 'mowakehhadnan@gmail.com',
        additionalText: 'لتلاوة سورة الفاتحة وفقًا لذلك',
        surahfatiha: 'سورة الفاتحة',
        instructorName: 'المدرب: mowakehhadnan@gmail.com',
        date: newDate
    },
    'portuguese': {
        certificateText: 'Ijazah de Surat Al-Fatiha',
        proudText: 'Este certificado é orgulhosamente apresentado a',
        emailText: 'mowakehhadnan@gmail.com',
        additionalText: 'para a recitação de Surat Al-Fatiha de acordo com',
        surahfatiha: 'Surat Al-Fatiha',
        instructorName: 'Instrutor: mowakehhadnan@gmail.com',
        date: newDate
    },
    'russian': {
        certificateText: 'Иджаза Сурат Аль-Фатиха',
        proudText: 'Этот сертификат с гордостью представлен',
        emailText: 'mowakehhadnan@gmail.com',
        additionalText: 'за чтение Сурата Аль-Фатиха согласно',
        surahfatiha: 'Сурата Аль-Фатиха',
        instructorName: 'Инструктор: mowakehhadnan@gmail.com',
        date: newDate
    },
    'indonesian': {
        certificateText: 'Ijazah de Surat Al-Fatiha',
        proudText: 'Sertifikat ini dengan bangga disajikan kepada',
        emailText: 'mowakehhadnan@gmail.com',
        additionalText: 'untuk membaca Surat Al-Fatiha sesuai dengan',
        surahfatiha: 'Surat Al-Fatiha',
        instructorName: 'Instruktur: mowakehhadnan@gmail.com',
        date: newDate
    },

};

// Function to add text to the image based on the selected language
// Function to add text to the image based on the selected language
async function addTextToImage(language) {
    const canvas = createCanvas(1600, 1300);
    const ctx = canvas.getContext('2d');

    // Load the image
    const image = await loadImage('./Cert.jpeg');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Set font properties
    const fontSize = 40;
    const lineHeight = fontSize + 80; // Line spacing
    const color = 'black';

    // Get the language-specific texts
    const textData = languages[language];

    if (textData) {

        const certificateText = textData.certificateText;
        const proudText = textData.proudText;
        const emailText = textData.emailText;
        const additionalText = textData.additionalText;
        const verse = textData.surahfatiha
        const instructorName = textData.instructorName
        const currentDate = textData.date

        const textLines = [certificateText, proudText, emailText, additionalText, verse, instructorName, currentDate];

        // Calculate the positions to center the text
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - (lineHeight * textLines.length) / 2.35;

        ctx.fillStyle = color;
        ctx.font = `${fontSize}px '${language}'`;

        // Draw each line of text with line spacing
        for (let i = 0; i < textLines.length; i++) {
            const text = textLines[i];
            const textWidth = ctx.measureText(text).width;
            const x = centerX - textWidth / 2;
            const y = centerY + i * lineHeight;
            ctx.fillText(text, x, y);
        }
    }

    // Save the canvas as an image
    const buffer = canvas.toBuffer('image/jpeg', { quality: 1, chromaSubsampling: false });
    writeFileSync('./Cert_with_text.jpeg', buffer, 'utf-8');
}

// Example: Set the user's selected languages (replace with your mechanism)
const language = 'Chinese';
addTextToImage(language).then(() => {
    console.log('Text added to the image');
}).catch((error) => {
    console.error('Error:', error);
});