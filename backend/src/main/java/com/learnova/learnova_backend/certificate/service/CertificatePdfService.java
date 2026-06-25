package com.learnova.learnova_backend.certificate.service;

import com.learnova.learnova_backend.certificate.entity.Certificate;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.Locale;

/**
 * Renders an already-issued certificate as a PDF. Pulls only the trusted
 * certificate/course/learner fields needed for display — no eligibility logic here,
 * that stays in CertificateService.
 */
@Service
public class CertificatePdfService {

    private static final Color SALEM_GREEN = new Color(0x2E, 0x7D, 0x32);
    private static final Color ANZAC_GOLD = new Color(0xD4, 0xA5, 0x37);
    private static final Color MUTED_TEXT = new Color(0x6B, 0x72, 0x80);
    private static final float BORDER_INSET = 24f;
    private static final DateTimeFormatter ISSUED_AT_FORMAT =
            DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withLocale(Locale.US);

    public byte[] generateCertificatePdf(Certificate certificate) {
        Document document = new Document(PageSize.A4.rotate(), 70, 70, 50, 50);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new BorderPageEvent());
            document.open();

            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, SALEM_GREEN);
            Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, Color.BLACK);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 13, MUTED_TEXT);
            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.BLACK);
            Font courseFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 17, Color.BLACK);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 11, MUTED_TEXT);
            Font codeFont = FontFactory.getFont(FontFactory.COURIER, 11, MUTED_TEXT);

            document.add(centered("Learnova", brandFont, 10f));
            document.add(centered("Certificate of Completion", headingFont, 18f));
            document.add(centered("This certifies that", bodyFont, 6f));
            document.add(centered(certificate.getLearnerProfile().getDisplayName(), nameFont, 16f));
            document.add(centered("has successfully completed", bodyFont, 6f));
            document.add(centered(certificate.getCourse().getTitle(), courseFont, 8f));

            String instructorName = certificate.getCourse().getInstructorProfile().getUser().getFullName();
            if (instructorName != null && !instructorName.isBlank()) {
                document.add(centered("Instructed by " + instructorName, smallFont, 14f));
            }

            String issuedAtText = ISSUED_AT_FORMAT.format(
                    certificate.getIssuedAt().atZone(ZoneOffset.UTC));
            document.add(centered("Issued " + issuedAtText, smallFont, 18f));

            document.add(centered("———", FontFactory.getFont(FontFactory.HELVETICA, 12, ANZAC_GOLD), 16f));

            document.add(centered("VERIFICATION CODE", smallFont, 0f));
            document.add(centered(certificate.getCertificateCode(), codeFont, 16f));

            document.add(centered("Issued by Learnova", smallFont, 0f));

            document.close();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate certificate PDF", e);
        }

        return out.toByteArray();
    }

    private Paragraph centered(String text, Font font, float spacingAfter) {
        Paragraph paragraph = new Paragraph(text, font);
        paragraph.setAlignment(Element.ALIGN_CENTER);
        paragraph.setSpacingAfter(spacingAfter);
        return paragraph;
    }

    private static class BorderPageEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Rectangle pageSize = document.getPageSize();
            var canvas = writer.getDirectContentUnder();
            canvas.setColorStroke(SALEM_GREEN);
            canvas.setLineWidth(2f);
            canvas.rectangle(
                    pageSize.getLeft() + BORDER_INSET,
                    pageSize.getBottom() + BORDER_INSET,
                    pageSize.getWidth() - 2 * BORDER_INSET,
                    pageSize.getHeight() - 2 * BORDER_INSET);
            canvas.stroke();
        }
    }
}
