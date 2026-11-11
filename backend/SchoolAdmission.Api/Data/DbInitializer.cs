using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // 1. Seed Admin User if not exists
        if (!await db.AdminUsers.AnyAsync(u => u.Username == "admin"))
        {
            db.AdminUsers.Add(new AdminUser
            {
                Id = "admin_1",
                Username = "admin",
                PasswordHash = "admin123", // Plain/demo hash for straightforward evaluation
                CreatedAt = DateTime.UtcNow
            });
        }

        // 2. Seed Academic Classes
        var defaultClasses = new[] { "Class 6", "Class 7", "Class 8", "Class 9", "Class 10" };
        foreach (var clsName in defaultClasses)
        {
            if (!await db.AcademicClasses.AnyAsync(c => c.Name == clsName))
            {
                db.AcademicClasses.Add(new AcademicClass
                {
                    Id = "cls_" + Guid.NewGuid().ToString("N")[..8],
                    Name = clsName,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // 3. Seed Academic Shifts
        var defaultShifts = new[] { "Morning Shift", "Day Shift" };
        foreach (var shiftName in defaultShifts)
        {
            if (!await db.AcademicShifts.AnyAsync(s => s.Name == shiftName))
            {
                db.AcademicShifts.Add(new AcademicShift
                {
                    Id = "shf_" + Guid.NewGuid().ToString("N")[..8],
                    Name = shiftName,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await db.SaveChangesAsync();
    }
}
